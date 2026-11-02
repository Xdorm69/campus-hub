import { CornerUpLeft, Image as ImageIcon, Mic } from "lucide-react";
import { UserAvatar } from "@/components/ui/user-avatar";
import { ReplyPreview } from "@/types/message";

/** Scrolls to a loaded message and flashes it. */
export function jumpToMessage(messageId: string) {
  const element = document.getElementById(`message-${messageId}`);
  if (!element) return false;

  element.scrollIntoView({ behavior: "smooth", block: "center" });
  element.classList.remove("message-highlight");
  // Force a reflow so the animation restarts on repeated clicks.
  void element.offsetWidth;
  element.classList.add("message-highlight");
  return true;
}

/** The small "↱ @user: snippet" line above a reply, Discord style. */
export function ReplyReference({ reply }: { reply: ReplyPreview }) {
  const label = reply.isDeleted
    ? "Original message was deleted"
    : reply.content ||
      (reply.hasVoiceNote ? "Voice message" : reply.hasAttachments ? "Click to see attachment" : "");

  return (
    <button
      type="button"
      onClick={() => jumpToMessage(reply.id)}
      disabled={reply.isDeleted}
      className="mb-0.5 ml-5 flex max-w-full items-center gap-1.5 text-left text-[13px] text-muted-foreground hover:text-foreground disabled:cursor-default"
    >
      <CornerUpLeft className="h-3.5 w-3.5 shrink-0 -scale-x-100" />
      {!reply.isDeleted && reply.author && (
        <>
          <UserAvatar user={reply.author} className="h-4 w-4" fallbackClassName="text-[8px]" />
          <span className="shrink-0 font-semibold text-foreground/80">@{reply.author.username}</span>
        </>
      )}
      <span className="truncate italic">{label}</span>
      {reply.hasVoiceNote && <Mic className="h-3.5 w-3.5 shrink-0" />}
      {reply.hasAttachments && !reply.content && <ImageIcon className="h-3.5 w-3.5 shrink-0" />}
    </button>
  );
}
