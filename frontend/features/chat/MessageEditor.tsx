"use client";

import { useRef, useState } from "react";
import { useAutoResizeTextarea } from "@/hooks/useAutoResizeTextarea";
import { useEditMessage } from "@/hooks/useMessages";
import { MESSAGE_MAX_LENGTH } from "@/lib/constants";
import { Message } from "@/types/message";
import { useChat } from "./ChatContext";

/** Inline editor: Enter saves, Escape cancels. */
export function MessageEditor({ message }: { message: Message }) {
  const { classRoom, setEditingId, composerRef } = useChat();
  const editMessage = useEditMessage(classRoom.id);
  const [draft, setDraft] = useState(message.content);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useAutoResizeTextarea(textareaRef, draft, 240);

  const close = () => {
    setEditingId(null);
    composerRef.current?.focus();
  };

  const save = () => {
    const content = draft.trim();
    if (content === message.content) return close();
    if (!content && message.attachments.length === 0) return;

    editMessage.mutate({ messageId: message.id, content });
    close();
  };

  return (
    <div className="mt-1">
      <textarea
        ref={textareaRef}
        value={draft}
        autoFocus
        rows={1}
        maxLength={MESSAGE_MAX_LENGTH}
        onFocus={(e) => e.currentTarget.setSelectionRange(draft.length, draft.length)}
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Escape") {
            e.preventDefault();
            close();
          } else if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            save();
          }
        }}
        className="w-full resize-none rounded-lg bg-input px-4 py-2.5 text-[15px] focus:outline-none"
      />
      <p className="mt-1 text-xs text-muted-foreground">
        escape to{" "}
        <button type="button" className="text-primary hover:underline" onClick={close}>
          cancel
        </button>{" "}
        • enter to{" "}
        <button type="button" className="text-primary hover:underline" onClick={save}>
          save
        </button>
      </p>
    </div>
  );
}
