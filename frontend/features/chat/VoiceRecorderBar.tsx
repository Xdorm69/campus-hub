"use client";

import { SendHorizontal, Trash2 } from "lucide-react";
import { VOICE_LIMITS } from "@/lib/constants";
import { formatDuration } from "@/lib/format";
import { cn } from "@/lib/utils";

interface VoiceRecorderBarProps {
  elapsedMs: number;
  onCancel: () => void;
  onSend: () => void;
}

/** Replaces the composer's input row while recording. */
export function VoiceRecorderBar({ elapsedMs, onCancel, onSend }: VoiceRecorderBarProps) {
  const remainingMs = VOICE_LIMITS.MAX_DURATION_MS - elapsedMs;
  const nearLimit = remainingMs < 15_000;

  return (
    <div
      className="flex items-center gap-3 px-3 py-2"
      onKeyDown={(event) => event.key === "Escape" && onCancel()}
    >
      <button
        type="button"
        onClick={onCancel}
        className="rounded-full p-1.5 text-muted-foreground transition-colors hover:bg-destructive/15 hover:text-destructive"
        aria-label="Discard recording"
        title="Discard (Esc)"
      >
        <Trash2 className="h-5 w-5" />
      </button>

      <span className="relative flex h-3 w-3">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-destructive opacity-75" />
        <span className="relative inline-flex h-3 w-3 rounded-full bg-destructive" />
      </span>

      <div className="flex min-w-0 flex-1 items-center gap-3">
        <span className="text-sm font-medium tabular-nums" aria-live="polite">
          {formatDuration(elapsedMs)}
        </span>
        <div className="h-1 min-w-0 flex-1 overflow-hidden rounded-full bg-muted-foreground/20">
          <div
            className={cn("h-full transition-[width] duration-200", nearLimit ? "bg-warning" : "bg-destructive")}
            style={{ width: `${Math.min(elapsedMs / VOICE_LIMITS.MAX_DURATION_MS, 1) * 100}%` }}
          />
        </div>
        <span className={cn("hidden text-xs sm:inline", nearLimit ? "text-warning" : "text-muted-foreground")}>
          {nearLimit ? `${Math.ceil(remainingMs / 1000)}s left` : `max ${formatDuration(VOICE_LIMITS.MAX_DURATION_MS)}`}
        </span>
      </div>

      <button
        type="button"
        onClick={onSend}
        autoFocus
        className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-primary-foreground transition-colors hover:bg-primary/90"
        aria-label="Send voice message"
        title="Send voice message"
      >
        <SendHorizontal className="h-4 w-4" />
      </button>
    </div>
  );
}
