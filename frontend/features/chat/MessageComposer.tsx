"use client";

import { useRef, useState } from "react";
import { Mic, MicOff, PlusCircle, SendHorizontal, X } from "lucide-react";
import { toast } from "sonner";
import { useAutoResizeTextarea } from "@/hooks/useAutoResizeTextarea";
import { useSendMessage } from "@/hooks/useMessages";
import { useVoiceRecorder } from "@/hooks/useVoiceRecorder";
import { ATTACHMENT_LIMITS, MESSAGE_MAX_LENGTH, VOICE_LIMITS } from "@/lib/constants";
import { formatBytes, formatDuration } from "@/lib/format";
import { cn } from "@/lib/utils";
import { useChat } from "./ChatContext";
import { ComposerAttachments } from "./ComposerAttachments";
import { GifPicker } from "./GifPicker";
import { VoiceRecorderBar } from "./VoiceRecorderBar";

const ACCEPTED_TYPES: readonly string[] = ATTACHMENT_LIMITS.ACCEPT;

/** Drops files the server would reject, explaining why. */
function validateFiles(existing: File[], incoming: File[]) {
  const accepted: File[] = [];

  for (const file of incoming) {
    if (existing.length + accepted.length >= ATTACHMENT_LIMITS.MAX_FILES) {
      toast.error(`You can attach up to ${ATTACHMENT_LIMITS.MAX_FILES} files per message.`);
      break;
    }
    if (!ACCEPTED_TYPES.includes(file.type)) {
      toast.error(`${file.name}: this file type isn't supported.`);
      continue;
    }
    if (file.size > ATTACHMENT_LIMITS.MAX_SIZE) {
      toast.error(`${file.name} is larger than ${formatBytes(ATTACHMENT_LIMITS.MAX_SIZE)}.`);
      continue;
    }
    accepted.push(file);
  }

  return accepted;
}

export function MessageComposer() {
  const { classRoom, replyingTo, cancelReply, composerRef, scrollToBottom } = useChat();
  const sendMessage = useSendMessage(classRoom.id);
  const [content, setContent] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useAutoResizeTextarea(composerRef, content, 320);

  const addFiles = (incoming: File[]) => {
    if (incoming.length === 0) return;
    setFiles((current) => [...current, ...validateFiles(current, incoming)]);
  };

  const canSend = content.trim().length > 0 || files.length > 0;

  const afterSend = () => {
    cancelReply();
    scrollToBottom();
  };

  const submit = () => {
    if (!canSend) return;

    sendMessage.mutate({ content: content.trim(), files, replyTo: replyingTo });
    setContent("");
    setFiles([]);
    afterSend();
  };

  const recorder = useVoiceRecorder({
    onRecorded: (voice) => {
      sendMessage.mutate({ content: "", files: [], voice, replyTo: replyingTo });
      afterSend();
    },
  });

  const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Enter" && !event.shiftKey && !event.nativeEvent.isComposing) {
      event.preventDefault();
      submit();
    } else if (event.key === "Escape" && replyingTo) {
      cancelReply();
    }
  };

  const handlePaste = (event: React.ClipboardEvent<HTMLTextAreaElement>) => {
    const pasted = Array.from(event.clipboardData.files);
    if (pasted.length > 0) {
      event.preventDefault();
      addFiles(pasted);
    }
  };

  if (classRoom.isMuted) {
    return (
      <div className="px-4 pb-6">
        <div className="flex items-center gap-3 rounded-lg bg-input px-4 py-3 text-sm text-muted-foreground">
          <MicOff className="h-5 w-5" />
          You&apos;ve been muted in this class and can&apos;t send messages.
        </div>
      </div>
    );
  }

  const remaining = MESSAGE_MAX_LENGTH - content.length;

  return (
    <div className="shrink-0 px-4 pb-6">
      {replyingTo && (
        <div className="flex items-center justify-between rounded-t-lg bg-secondary/70 px-4 py-2 text-sm text-muted-foreground">
          <span className="truncate">
            Replying to{" "}
            <span className="font-semibold text-foreground">
              {replyingTo.author?.username ?? "Deleted user"}
            </span>
          </span>
          <button
            type="button"
            onClick={cancelReply}
            className="rounded-full p-0.5 hover:text-foreground"
            aria-label="Cancel reply"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      <div className={cn("bg-input", replyingTo ? "rounded-b-lg" : "rounded-lg")}>
        {recorder.isRecording ? (
          <VoiceRecorderBar
            elapsedMs={recorder.elapsedMs}
            onCancel={recorder.cancel}
            onSend={recorder.stop}
          />
        ) : (
          <>
            <ComposerAttachments
              files={files}
              onRemove={(index) => setFiles((current) => current.filter((_, i) => i !== index))}
            />

            <div className="flex items-end gap-1 px-2">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="my-2.5 rounded-full p-1 text-muted-foreground transition-colors hover:text-foreground"
                aria-label="Attach files"
                title="Attach files"
              >
                <PlusCircle className="h-6 w-6" />
              </button>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                hidden
                accept={ATTACHMENT_LIMITS.ACCEPT.join(",")}
                onChange={(event) => {
                  addFiles(Array.from(event.target.files ?? []));
                  event.target.value = "";
                }}
              />

              <textarea
                ref={composerRef}
                value={content}
                rows={1}
                maxLength={MESSAGE_MAX_LENGTH}
                onChange={(event) => setContent(event.target.value)}
                onKeyDown={handleKeyDown}
                onPaste={handlePaste}
                placeholder={`Message #${classRoom.name}`}
                aria-label={`Message #${classRoom.name}`}
                className="max-h-80 flex-1 resize-none bg-transparent px-2 py-[13px] text-[15px] leading-[1.375rem] placeholder:text-muted-foreground focus:outline-none"
              />

              {remaining < 500 && (
                <span className={cn("my-3.5 text-xs", remaining < 100 ? "text-destructive" : "text-muted-foreground")}>
                  {remaining}
                </span>
              )}

              <GifPicker
                onPick={(gif) => {
                  sendMessage.mutate({ content: "", files: [], gif, replyTo: replyingTo });
                  afterSend();
                }}
              />

              {/* Empty composer -> mic (record a voice message); otherwise send. */}
              {!canSend && recorder.isSupported ? (
                <button
                  type="button"
                  onClick={recorder.start}
                  className="my-2 rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-primary/10 hover:text-primary"
                  aria-label="Record voice message"
                  title={`Record a voice message (up to ${formatDuration(VOICE_LIMITS.MAX_DURATION_MS)})`}
                >
                  <Mic className="h-5 w-5" />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={submit}
                  disabled={!canSend}
                  className="my-2 rounded-md p-1.5 text-primary transition-colors hover:bg-primary/10 disabled:text-muted-foreground disabled:opacity-40 disabled:hover:bg-transparent"
                  aria-label="Send message"
                  title="Send (Enter)"
                >
                  <SendHorizontal className="h-5 w-5" />
                </button>
              )}
            </div>
          </>
        )}
      </div>

      <p className="mt-1 hidden px-1 text-[11px] text-muted-foreground sm:block">
        <kbd className="font-semibold">Enter</kbd> to send · <kbd className="font-semibold">Shift + Enter</kbd>{" "}
        for a new line · paste images to attach · <code>**bold**</code> <code>*italic*</code>{" "}
        <code>`code`</code>
      </p>
    </div>
  );
}
