"use client";

import { memo } from "react";
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
  const { classRoom, editingId } = useChat();
  const isEditing = editingId === message.id;
  const isPending = message.clientStatus === "sending";
  const isFailed = message.clientStatus === "failed";
  const isConfirmed = !message.clientStatus;
  const showHeader = !isGrouped || Boolean(message.replyTo);

  return (
    <div
      id={`message-${message.id}`}
      className={cn(
        "group relative px-4 py-0.5 transition-colors hover:bg-accent/60",
        showHeader && "mt-[17px]",
        isEditing && "bg-accent/60"
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
              className="hidden pt-1 text-right text-[11px] leading-[1.375rem] text-muted-foreground group-hover:block"
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
            </div>
          )}

          {isFailed && <FailedMessageActions message={message} />}
          {isConfirmed && <MessageReactions message={message} />}
        </div>
      </div>

      {isConfirmed && !isEditing && <MessageToolbar message={message} />}
    </div>
  );
}

/** Memoized: polling replaces only the messages that changed. */
export const MessageItem = memo(MessageItemComponent);
