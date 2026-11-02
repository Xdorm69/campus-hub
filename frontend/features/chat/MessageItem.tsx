"use client";

import { memo, useEffect, useRef } from "react";
import { AlertCircle, Crown } from "lucide-react";
import { UserAvatar } from "@/components/ui/user-avatar";
import { UserProfilePopover } from "@/features/members/UserProfilePopover";
import { useDiscardFailedMessage, useSendMessage } from "@/hooks/useMessages";
import { formatFullDate, formatMessageTimestamp, formatTime } from "@/lib/format";
import { cn } from "@/lib/utils";
import { Message } from "@/types/message";
import { useChat } from "./ChatContext";
import { MessageAttachments } from "./MessageAttachments";
import { MessageContent } from "./MessageContent";
import { MessageEditor } from "./MessageEditor";
import { MessageReactions } from "./MessageReactions";
import { MessageToolbar } from "./MessageToolbar";
import { ReplyReference } from "./ReplyReference";
import { MessageGif } from "./MessageGif";
import { VoicePlayer } from "./VoicePlayer";

interface MessageItemProps {
  message: Message;
  /** Continuation of the previous author's run: no avatar/header. */
  isGrouped: boolean;
}

function AuthorName({ message }: { message: Message }) {
  const { classRoom } = useChat();
  const author = message.author;

  if (!author) {
    return <span className="font-medium text-muted-foreground">Deleted user</span>;
  }

  const isAdmin = author.role === "ADMIN";

  return (
    <UserProfilePopover userId={author.id} classId={classRoom.id} canModerateClass={classRoom.canModerate}>
      <button
        type="button"
        className={cn("font-medium hover:underline", isAdmin ? "text-destructive" : "text-foreground")}
      >
        {author.username}
      </button>
    </UserProfilePopover>
  );
}

function FailedMessageActions({ message }: { message: Message }) {
  const { classRoom } = useChat();
  const send = useSendMessage(classRoom.id);
  const discard = useDiscardFailedMessage(classRoom.id);

  return (
    <p className="mt-1 flex items-center gap-1.5 text-xs text-destructive">
      <AlertCircle className="h-3.5 w-3.5" />
      Message failed to send.
      <button
        type="button"
        className="font-semibold hover:underline"
        onClick={() => {
          discard(message.id);
          if (message.clientPayload) send.mutate(message.clientPayload);
        }}
      >
        Retry
      </button>
      ·
      <button type="button" className="font-semibold hover:underline" onClick={() => discard(message.id)}>
        Discard
      </button>
    </p>
  );
}

function MessageItemComponent({ message, isGrouped }: MessageItemProps) {
  const { classRoom, me, editingId, isTouch, activeMessageId, toggleActiveMessage, clearActiveMessage } = useChat();
  const mentionsMe = message.mentions?.some((m) => m.id === me.id) ?? false;
  const rowRef = useRef<HTMLDivElement>(null);
  const isEditing = editingId === message.id;
  const isActive = activeMessageId === message.id;
  const isPending = message.clientStatus === "sending";
  const isFailed = message.clientStatus === "failed";
  const isConfirmed = !message.clientStatus;
  const showHeader = !isGrouped || Boolean(message.replyTo);

  // Touch: a tap anywhere outside the selected message closes its actions.
  useEffect(() => {
    if (!isActive) return;
    const onPointerDown = (event: PointerEvent) => {
      const target = event.target as Node;
      // Ignore taps inside this message and inside its popovers/dialogs.
      if (rowRef.current?.contains(target)) return;
      if ((target as HTMLElement).closest?.("[data-radix-popper-content-wrapper], [role=dialog]")) return;
      clearActiveMessage();
    };
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [isActive, clearActiveMessage]);

  // Touch: tapping the message body (not a link, button or player inside
  // it) shows the action toolbar that hover reveals on desktop.
  const handleTap = (event: React.MouseEvent<HTMLDivElement>) => {
    if (!isTouch || !isConfirmed || isEditing) return;
    const target = event.target as HTMLElement;
    if (target.closest("a, button, input, textarea, video, audio, [role='slider']")) return;
    toggleActiveMessage(message.id);
  };

  return (
    <div
      ref={rowRef}
      id={`message-${message.id}`}
      onClick={handleTap}
      data-active={isActive || undefined}
      className={cn(
        "group relative px-4 py-0.5 transition-colors",
        // Hover highlight only where hover exists; sticky :hover on phones
        // would leave a random message highlighted after every tap.
        "[@media(hover:hover)]:hover:bg-accent/60",
        showHeader && "mt-[17px]",
        // Discord-style: messages that @mention you get a gold tint + bar.
        mentionsMe && "bg-warning/10 shadow-[inset_2px_0_0_hsl(var(--warning))]",
        (isEditing || isActive) && "bg-accent/60"
      )}
    >
      {message.replyTo && <ReplyReference reply={message.replyTo} />}

      <div className="flex gap-4">
        <div className="w-10 shrink-0">
          {showHeader ? (
            message.author ? (
              <UserProfilePopover
                userId={message.author.id}
                classId={classRoom.id}
                canModerateClass={classRoom.canModerate}
              >
                <button type="button" className="mt-0.5 rounded-full transition-opacity hover:opacity-90">
                  <UserAvatar user={message.author} />
                </button>
              </UserProfilePopover>
            ) : (
              <UserAvatar user={null} className="mt-0.5" />
            )
          ) : (
            <time
              dateTime={message.createdAt}
              title={formatFullDate(message.createdAt)}
              className="hidden pt-1 text-right text-[11px] leading-[1.375rem] text-muted-foreground group-hover:block group-data-[active]:block"
            >
              {formatTime(message.createdAt)}
            </time>
          )}
        </div>

        <div className="min-w-0 flex-1">
          {showHeader && (
            <div className="flex flex-wrap items-baseline gap-x-2">
              <AuthorName message={message} />
              {message.author?.role === "ADMIN" && (
                <Crown className="h-3.5 w-3.5 self-center text-warning" aria-label="Admin" />
              )}
              <time
                dateTime={message.createdAt}
                title={formatFullDate(message.createdAt)}
                className="text-xs text-muted-foreground"
              >
                {formatMessageTimestamp(message.createdAt)}
              </time>
            </div>
          )}

          {isEditing ? (
            <MessageEditor message={message} />
          ) : (
            <div className={cn(isPending && "opacity-50", isFailed && "text-destructive")}>
              {message.content && (
                <MessageContent
                  content={message.content}
                  mentions={message.mentions}
                  meId={me.id}
                  suffix={
                    message.editedAt && (
                      <span
                        className="ml-1 text-[10px] text-muted-foreground"
                        title={formatFullDate(message.editedAt)}
                      >
                        (edited)
                      </span>
                    )
                  }
                />
              )}
              <MessageAttachments attachments={message.attachments} />
              {message.voiceNote && <VoicePlayer voiceNote={message.voiceNote} seed={message.id} />}
              {message.gif && <MessageGif gif={message.gif} />}
            </div>
          )}

          {isFailed && <FailedMessageActions message={message} />}
          {isConfirmed && <MessageReactions message={message} />}
        </div>
      </div>

      {isConfirmed && !isEditing && <MessageToolbar message={message} isActive={isActive} />}
    </div>
  );
}

/** Memoized: polling replaces only the messages that changed. */
export const MessageItem = memo(MessageItemComponent);
