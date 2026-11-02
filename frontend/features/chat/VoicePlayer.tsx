"use client";

import { useEffect, useRef, useState } from "react";
import { Loader2, MicOff, Pause, Play } from "lucide-react";
import { formatDuration } from "@/lib/format";
import { cn } from "@/lib/utils";
import { VoiceNote } from "@/types/message";

const SPEEDS = [1, 1.5, 2] as const;

// Only one voice note plays at a time across the whole chat.
let activeAudio: HTMLAudioElement | null = null;

// Fixed pseudo-waveform per note, so the bar looks like audio without
// decoding the file.
function waveformBars(seed: string, count = 36) {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) hash = (hash * 31 + seed.charCodeAt(i)) | 0;
  return Array.from({ length: count }, (_, i) => {
    hash = (hash * 1103515245 + 12345 + i) | 0;
    return 0.25 + (Math.abs(hash) % 75) / 100;
  });
}

export function VoicePlayer({ voiceNote, seed }: { voiceNote: VoiceNote; seed: string }) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [positionMs, setPositionMs] = useState(0);
  const [speed, setSpeed] = useState<(typeof SPEEDS)[number]>(1);

  // Trust the recorder's duration: Chrome's WebM recordings report Infinity.
  const durationMs = voiceNote.durationMs;
  const progress = durationMs > 0 ? Math.min(positionMs / durationMs, 1) : 0;
  const bars = waveformBars(seed);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    // defaultPlaybackRate survives the reset browsers do when media loads.
    audio.defaultPlaybackRate = speed;
    audio.playbackRate = speed;
  }, [speed]);

  useEffect(
    () => () => {
      if (activeAudio === audioRef.current) activeAudio = null;
    },
    []
  );

  if (voiceNote.isExpired || !voiceNote.url) {
    return (
      <div className="mt-1 inline-flex items-center gap-2 rounded-full bg-muted px-3 py-1.5 text-sm text-muted-foreground">
        <MicOff className="h-4 w-4" />
        Voice message expired · {formatDuration(durationMs)}
      </div>
    );
  }

  const togglePlay = async () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (!audio.paused) {
      audio.pause();
      return;
    }

    if (activeAudio && activeAudio !== audio) activeAudio.pause();
    activeAudio = audio;
    if (positionMs >= durationMs) audio.currentTime = 0;

    try {
      setIsLoading(true);
      await audio.play();
    } catch {
      // Autoplay rules or a decode error; the button simply stays on "play".
    } finally {
      setIsLoading(false);
    }
  };

  const seek = (event: React.MouseEvent<HTMLDivElement>) => {
    const audio = audioRef.current;
    if (!audio || durationMs <= 0) return;
    const rect = event.currentTarget.getBoundingClientRect();
    const ratio = Math.min(Math.max((event.clientX - rect.left) / rect.width, 0), 1);
    audio.currentTime = (ratio * durationMs) / 1000;
    setPositionMs(ratio * durationMs);
  };

  const cycleSpeed = () => setSpeed((current) => SPEEDS[(SPEEDS.indexOf(current) + 1) % SPEEDS.length]);

  return (
    <div className="mt-1 flex w-full max-w-sm items-center gap-3 rounded-full bg-muted py-1.5 pl-1.5 pr-3">
      <button
        type="button"
        onClick={togglePlay}
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground transition-colors hover:bg-primary/90"
        aria-label={isPlaying ? "Pause voice message" : "Play voice message"}
      >
        {isLoading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : isPlaying ? (
          <Pause className="h-4 w-4 fill-current" />
        ) : (
          <Play className="ml-0.5 h-4 w-4 fill-current" />
        )}
      </button>

      <div
        role="slider"
        aria-label="Seek"
        aria-valuemin={0}
        aria-valuemax={Math.round(durationMs / 1000)}
        aria-valuenow={Math.round(positionMs / 1000)}
        tabIndex={0}
        onClick={seek}
        onKeyDown={(event) => {
          const audio = audioRef.current;
          if (!audio) return;
          if (event.key === "ArrowRight") audio.currentTime += 5;
          if (event.key === "ArrowLeft") audio.currentTime = Math.max(0, audio.currentTime - 5);
        }}
        className="flex h-8 min-w-0 flex-1 cursor-pointer items-center gap-[2px]"
      >
        {bars.map((height, index) => (
          <span
            key={index}
            className={cn(
              "w-full rounded-full transition-colors",
              index / bars.length < progress ? "bg-primary" : "bg-muted-foreground/40"
            )}
            style={{ height: `${height * 100}%` }}
          />
        ))}
      </div>

      <span className="w-9 shrink-0 text-right text-xs tabular-nums text-muted-foreground">
        {formatDuration(isPlaying || positionMs > 0 ? positionMs : durationMs)}
      </span>
      <button
        type="button"
        onClick={cycleSpeed}
        className="w-8 shrink-0 rounded bg-background/60 py-0.5 text-[11px] font-semibold text-muted-foreground hover:text-foreground"
        aria-label="Playback speed"
      >
        {speed}×
      </button>

      <audio
        ref={audioRef}
        src={voiceNote.url}
        preload="none"
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        onEnded={() => {
          setIsPlaying(false);
          setPositionMs(durationMs);
        }}
        onTimeUpdate={(event) => setPositionMs(event.currentTarget.currentTime * 1000)}
        onWaiting={() => setIsLoading(true)}
        onPlaying={() => setIsLoading(false)}
      />
    </div>
  );
}
