"use client";

import { useEffect, useRef, useState } from "react";
import { Play } from "lucide-react";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import { cn } from "@/lib/utils";

const isVideoUrl = (url: string) => /\.(mp4|webm)(\?|#|$)/i.test(url);

interface AutoplayMediaProps {
  src: string;
  /** Still frame shown before the video loads, or while paused. */
  poster?: string | null;
  alt: string;
  className?: string;
}

/**
 * A silent looping GIF-style clip. Video sources only play while on screen
 * (a long scrollback of GIFs would otherwise decode them all at once), and
 * with "reduce motion" enabled they wait for a click.
 */
export function AutoplayMedia({ src, poster, alt, className }: AutoplayMediaProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const reduceMotion = useMediaQuery("(prefers-reduced-motion: reduce)");
  const [isPaused, setIsPaused] = useState(true);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || reduceMotion) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) video.play().catch(() => {});
        else video.pause();
      },
      { threshold: 0.25 }
    );
    observer.observe(video);
    return () => observer.disconnect();
  }, [reduceMotion, src]);

  if (!isVideoUrl(src)) {
    // eslint-disable-next-line @next/next/no-img-element -- provider CDN media
    return <img src={src} alt={alt} loading="lazy" className={cn("object-cover", className)} />;
  }

  return (
    <span className="relative block h-full w-full">
      <video
        ref={videoRef}
        src={src}
        poster={poster ?? undefined}
        muted
        loop
        playsInline
        preload="metadata"
        aria-label={alt}
        className={cn("object-cover", className)}
        onPlay={() => setIsPaused(false)}
        onPause={() => setIsPaused(true)}
        onClick={(event) => {
          // With reduced motion the user starts/stops playback manually.
          if (!reduceMotion) return;
          event.preventDefault();
          const video = event.currentTarget;
          if (video.paused) video.play().catch(() => {});
          else video.pause();
        }}
      />
      {reduceMotion && isPaused && (
        <span className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <span className="rounded-full bg-black/60 p-2 text-white">
            <Play className="h-4 w-4 fill-current" />
          </span>
        </span>
      )}
    </span>
  );
}
