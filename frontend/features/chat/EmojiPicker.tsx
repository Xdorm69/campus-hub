"use client";

import { useState } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { REACTION_EMOJIS } from "@/lib/constants";

interface EmojiPickerProps {
  trigger: React.ReactNode;
  onSelect: (emoji: string) => void;
  onOpenChange?: (open: boolean) => void;
}

export function EmojiPicker({ trigger, onSelect, onOpenChange }: EmojiPickerProps) {
  const [open, setOpen] = useState(false);

  const handleOpenChange = (next: boolean) => {
    setOpen(next);
    onOpenChange?.(next);
  };

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>{trigger}</PopoverTrigger>
      <PopoverContent align="end" side="top" className="w-72 p-2">
        <p className="px-1 pb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Add reaction
        </p>
        <div className="grid grid-cols-8 gap-0.5">
          {REACTION_EMOJIS.map((emoji) => (
            <button
              key={emoji}
              type="button"
              className="flex h-8 w-8 items-center justify-center rounded text-xl transition-colors hover:bg-accent"
              onClick={() => {
                onSelect(emoji);
                handleOpenChange(false);
              }}
            >
              {emoji}
            </button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}
