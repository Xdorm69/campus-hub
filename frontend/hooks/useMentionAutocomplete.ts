"use client";

import { RefObject, useMemo, useState } from "react";
import { ClassMember } from "@/types/class";

const MAX_SUGGESTIONS = 8;
// "@" at the start or after a non-word char, followed by the partial name the
// caret is in. Mirrors the server's mention rules (backend/utils/mentions.js).
const TRIGGER = /(?:^|[^\w@])@([a-zA-Z0-9_]{0,20})$/;

interface Options {
  members: ClassMember[] | undefined;
  meId: string;
  value: string;
  setValue: (value: string) => void;
  textareaRef: RefObject<HTMLTextAreaElement | null>;
}

/**
 * Discord-style @mention autocomplete for a textarea: watches the text
 * before the caret, suggests matching class members, and replaces the
 * partial "@na" with "@name " on pick.
 */
export function useMentionAutocomplete({ members, meId, value, setValue, textareaRef }: Options) {
  const [trigger, setTrigger] = useState<{ start: number; query: string } | null>(null);
  const [activeIndex, setActiveIndex] = useState(0);

  /** Call on every change / caret move with the textarea's state. */
  const update = (text: string, caret: number | null) => {
    const match = caret === null ? null : TRIGGER.exec(text.slice(0, caret));
    if (!match) {
      setTrigger(null);
      return;
    }
    const query = match[1];
    if (trigger?.query !== query) setActiveIndex(0);
    setTrigger({ start: caret! - query.length - 1, query });
  };

  const suggestions = useMemo(() => {
    if (!trigger || !members) return [];
    const query = trigger.query.toLowerCase();

    return members
      .filter((m) => !m.banned && m.userId !== meId && m.user.username.toLowerCase().startsWith(query))
      .sort((a, b) => a.user.username.localeCompare(b.user.username))
      .slice(0, MAX_SUGGESTIONS);
  }, [trigger, members, meId]);

  const isOpen = trigger !== null && suggestions.length > 0;
  const close = () => setTrigger(null);

  const select = (member: ClassMember) => {
    if (!trigger) return;
    const before = value.slice(0, trigger.start);
    const after = value.slice(trigger.start + 1 + trigger.query.length);
    const insert = `@${member.user.username} `;
    setValue(before + insert + after);
    setTrigger(null);

    // Put the caret right after the inserted mention once React re-renders.
    requestAnimationFrame(() => {
      const textarea = textareaRef.current;
      if (!textarea) return;
      const caret = before.length + insert.length;
      textarea.focus();
      textarea.setSelectionRange(caret, caret);
    });
  };

  /** Returns true when the key was handled by the suggestion list. */
  const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (!isOpen) return false;

    switch (event.key) {
      case "ArrowDown":
        setActiveIndex((i) => (i + 1) % suggestions.length);
        break;
      case "ArrowUp":
        setActiveIndex((i) => (i - 1 + suggestions.length) % suggestions.length);
        break;
      case "Enter":
      case "Tab":
        select(suggestions[Math.min(activeIndex, suggestions.length - 1)]);
        break;
      case "Escape":
        close();
        break;
      default:
        return false;
    }
    event.preventDefault();
    return true;
  };

  return {
    isOpen,
    query: trigger?.query ?? "",
    suggestions,
    activeIndex,
    setActiveIndex,
    update,
    select,
    close,
    handleKeyDown,
  };
}
