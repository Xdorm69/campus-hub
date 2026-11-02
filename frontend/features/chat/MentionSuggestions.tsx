"use client";

import { Crown, ShieldCheck } from "lucide-react";
import { UserAvatar } from "@/components/ui/user-avatar";
import { cn } from "@/lib/utils";
import { ClassMember } from "@/types/class";

interface MentionSuggestionsProps {
  query: string;
  suggestions: ClassMember[];
  activeIndex: number;
  onHover: (index: number) => void;
  onSelect: (member: ClassMember) => void;
}

/** The "Members matching @..." list that floats above the composer. */
export function MentionSuggestions({ query, suggestions, activeIndex, onHover, onSelect }: MentionSuggestionsProps) {
  return (
    <div
      className="absolute inset-x-0 bottom-full mb-2 overflow-hidden rounded-lg border border-border bg-popover py-2 shadow-xl"
      role="listbox"
      aria-label="Mention a member"
    >
      <p className="px-3 pb-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        Members{query && <> matching <span className="normal-case text-foreground">@{query}</span></>}
      </p>
      {suggestions.map((member, index) => (
        <button
          key={member.id}
          type="button"
          role="option"
          aria-selected={index === activeIndex}
          // mousedown, not click: keeps focus (and the caret) in the textarea.
          onMouseDown={(event) => {
            event.preventDefault();
            onSelect(member);
          }}
          onMouseEnter={() => onHover(index)}
          className={cn(
            "mx-1 flex w-[calc(100%-0.5rem)] items-center gap-2.5 rounded-md px-2 py-1.5 text-left",
            index === activeIndex && "bg-accent"
          )}
        >
          <UserAvatar user={member.user} className="h-6 w-6" fallbackClassName="text-[10px]" />
          <span className="truncate text-sm font-medium">{member.user.username}</span>
          {member.user.role === "ADMIN" && <Crown className="h-3.5 w-3.5 shrink-0 text-warning" aria-label="Admin" />}
          {member.isModerator && member.user.role !== "ADMIN" && (
            <ShieldCheck className="h-3.5 w-3.5 shrink-0 text-success" aria-label="Moderator" />
          )}
          <span className="ml-auto hidden text-xs text-muted-foreground sm:inline">@{member.user.username}</span>
        </button>
      ))}
    </div>
  );
}
