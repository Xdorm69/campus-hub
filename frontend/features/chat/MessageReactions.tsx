"use client";

import { SmilePlus } from "lucide-react";
import { useToggleReaction } from "@/hooks/useMessages";
import { cn } from "@/lib/utils";
import { Message } from "@/types/message";
import { useChat } from "./ChatContext";
import { EmojiPicker } from "./EmojiPicker";

export function MessageReactions({ message }: { message: Message }) {
  const { classRoom, me } = useChat();
  const toggleReaction = useToggleReaction(classRoom.id);

  if (message.reactions.length === 0) return null;

  const toggle = (emoji: string) => toggleReaction.mutate({ messageId: message.id, emoji });

  return (
    <div className="mt-1 flex flex-wrap items-center gap-1">
      {message.reactions.map((reaction) => {
        const reacted = reaction.userIds.includes(me.id);
        return (
          <button
            key={reaction.emoji}
            type="button"
            onClick={() => toggle(reaction.emoji)}
            disabled={!classRoom.isMember}
            className={cn(
              "flex h-6 items-center gap-1.5 rounded-md border px-1.5 text-sm transition-colors",
              reacted
                ? "border-primary bg-primary/15 text-foreground"
                : "border-transparent bg-muted hover:border-muted-foreground/40"
            )}
            aria-pressed={reacted}
            title={reacted ? "Remove reaction" : "React"}
          >
            <span className="text-base leading-none">{reaction.emoji}</span>
            <span className={cn("text-xs font-semibold", reacted ? "text-primary" : "text-muted-foreground")}>
              {reaction.count}
            </span>
          </button>
        );
      })}

      {classRoom.isMember && (
        <EmojiPicker
          onSelect={toggle}
          trigger={
            <button
              type="button"
              className="flex h-6 items-center rounded-md bg-muted px-1.5 text-muted-foreground opacity-0 transition hover:text-foreground group-hover:opacity-100 [@media(hover:none)]:opacity-100"
              aria-label="Add reaction"
            >
              <SmilePlus className="h-4 w-4" />
            </button>
          }
        />
      )}
    </div>
  );
}
