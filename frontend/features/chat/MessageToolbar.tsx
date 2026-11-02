"use client";

import { useState } from "react";
import { Pencil, Reply, SmilePlus, Trash2 } from "lucide-react";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { useDeleteMessage, useToggleReaction } from "@/hooks/useMessages";
import { QUICK_REACTIONS } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { Message } from "@/types/message";
import { useChat } from "./ChatContext";
import { EmojiPicker } from "./EmojiPicker";

function ToolbarButton({
  label,
  destructive,
  className,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { label: string; destructive?: boolean }) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      className={cn(
        "flex h-8 w-8 items-center justify-center rounded text-muted-foreground transition-colors hover:bg-accent hover:text-foreground",
        destructive && "hover:text-destructive",
        className
      )}
      {...props}
    />
  );
}

/** Floating hover actions, top-right of a message. */
export function MessageToolbar({ message, isActive = false }: { message: Message; isActive?: boolean }) {
  const { classRoom, me, isAdmin, isTouch, startReply, setEditingId, clearActiveMessage } = useChat();
  const toggleReaction = useToggleReaction(classRoom.id);
  const deleteMessage = useDeleteMessage(classRoom.id);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const isOwn = message.author?.id === me.id;
  const canPost = classRoom.isMember && !classRoom.isMuted;
  const authorIsAdmin = message.author?.role === "ADMIN";
  const canDelete = isOwn || (classRoom.canModerate && (!authorIsAdmin || isAdmin));

  const react = (emoji: string) => {
    toggleReaction.mutate({ messageId: message.id, emoji });
    clearActiveMessage();
  };

  return (
    <>
      <div
        className={cn(
          "absolute right-4 z-10 items-center rounded-md border border-border bg-card shadow-sm",
          // Touch: float fully above the message so it doesn't cover what was tapped.
          isTouch ? "bottom-full mb-1" : "-top-4",
          // Desktop: on hover/focus. Touch: on tap (isActive) — sticky :hover
          // on phones would otherwise leave toolbars open everywhere.
          pickerOpen || isActive
            ? "flex"
            : "hidden [@media(hover:hover)]:group-hover:flex [@media(hover:hover)]:group-focus-within:flex",
          // Bigger tap targets on touch screens.
          isTouch && "[&_button]:h-10 [&_button]:w-10"
        )}
      >
        {classRoom.isMember &&
          QUICK_REACTIONS.map((emoji) => (
            <ToolbarButton key={emoji} label={`React with ${emoji}`} onClick={() => react(emoji)}>
              <span className="text-base">{emoji}</span>
            </ToolbarButton>
          ))}
        {classRoom.isMember && (
          <EmojiPicker
            onSelect={react}
            onOpenChange={setPickerOpen}
            trigger={
              <ToolbarButton label="Add reaction">
                <SmilePlus className="h-4 w-4" />
              </ToolbarButton>
            }
          />
        )}
        {canPost && (
          <ToolbarButton label="Reply" onClick={() => startReply(message)}>
            <Reply className="h-4 w-4" />
          </ToolbarButton>
        )}
        {isOwn && canPost && !message.voiceNote && !message.gif && (
          <ToolbarButton
            label="Edit"
            onClick={() => {
              setEditingId(message.id);
              clearActiveMessage();
            }}
          >
            <Pencil className="h-4 w-4" />
          </ToolbarButton>
        )}
        {canDelete && (
          <ToolbarButton
            label="Delete"
            destructive
            onClick={(e) => (e.shiftKey ? deleteMessage.mutate(message.id) : setConfirmDelete(true))}
          >
            <Trash2 className="h-4 w-4" />
          </ToolbarButton>
        )}
      </div>

      <ConfirmDialog
        open={confirmDelete}
        onOpenChange={setConfirmDelete}
        title="Delete message"
        description={
          <>
            Are you sure you want to delete this message?
            {!isTouch && (
              <span className="mt-2 block text-xs">Tip: hold Shift while clicking delete to skip this.</span>
            )}
          </>
        }
        confirmLabel="Delete"
        destructive
        onConfirm={() => {
          deleteMessage.mutate(message.id);
          setConfirmDelete(false);
        }}
      />
    </>
  );
}
