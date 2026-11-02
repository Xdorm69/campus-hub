"use client";

import { useRef, useState } from "react";
import { Loader2, RotateCw, Search, SearchX } from "lucide-react";
import { AutoplayMedia } from "@/components/ui/autoplay-media";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Skeleton } from "@/components/ui/skeleton";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { useGifSearch } from "@/hooks/useGifSearch";
import { useIntersectionObserver } from "@/hooks/useIntersectionObserver";
import { gifProvider, GifResult } from "@/lib/gifs";
import { GifEmbed } from "@/types/message";

function GifGrid({ query, onPick }: { query: string; onPick: (gif: GifEmbed) => void }) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const { data, isLoading, isError, refetch, fetchNextPage, hasNextPage, isFetchingNextPage } =
    useGifSearch(query);

  const sentinelRef = useIntersectionObserver<HTMLDivElement>(
    () => {
      if (hasNextPage && !isFetchingNextPage) fetchNextPage();
    },
    { root: scrollRef, rootMargin: "0px 0px 300px 0px", enabled: Boolean(hasNextPage) && !isFetchingNextPage }
  );

  // Provider terms: show results in the order and composition returned.
  const results: GifResult[] = data?.pages.flatMap((page) => page.results) ?? [];

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 gap-2 p-3">
        {Array.from({ length: 8 }).map((_, i) => (
          <Skeleton key={i} className="h-28 w-full" />
        ))}
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-2 p-6 text-center text-sm text-muted-foreground">
        Couldn&apos;t load GIFs.
        <button
          type="button"
          onClick={() => refetch()}
          className="flex items-center gap-1.5 font-medium text-primary hover:underline"
        >
          <RotateCw className="h-3.5 w-3.5" /> Try again
        </button>
      </div>
    );
  }

  if (results.length === 0) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-2 p-6 text-center text-sm text-muted-foreground">
        <SearchX className="h-8 w-8" />
        No GIFs found for “{query}”.
      </div>
    );
  }

  return (
    <div ref={scrollRef} className="h-full overflow-y-auto p-3">
      {/* CSS columns give a masonry layout without measuring images. */}
      <div className="columns-2 gap-2">
        {results.map((result) => (
          <button
            key={`${result.embed.provider}-${result.embed.providerId}`}
            type="button"
            onClick={() => onPick(result.embed)}
            className="mb-2 block w-full overflow-hidden rounded-md bg-muted outline-none ring-primary transition hover:ring-2 focus-visible:ring-2"
            style={{ aspectRatio: `${result.thumbnail.width} / ${result.thumbnail.height}` }}
            title={result.embed.title || "GIF"}
          >
            <AutoplayMedia
              src={result.thumbnail.url}
              poster={result.embed.previewUrl}
              alt={result.embed.title || "GIF"}
              className="h-full w-full"
            />
          </button>
        ))}
      </div>
      <div ref={sentinelRef} className="h-px" />
      {isFetchingNextPage && (
        <div className="flex justify-center py-2">
          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
        </div>
      )}
    </div>
  );
}

/** Discord-style GIF button + search popover. Hidden if no provider is configured. */
export function GifPicker({ onPick }: { onPick: (gif: GifEmbed) => void }) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const query = useDebouncedValue(search.trim(), 350);

  if (!gifProvider) return null;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className="my-2.5 rounded px-1.5 py-0.5 text-[11px] font-extrabold tracking-wide text-muted-foreground ring-1 ring-current transition-colors hover:text-foreground"
          aria-label="Send a GIF"
          title="Send a GIF"
        >
          GIF
        </button>
      </PopoverTrigger>
      <PopoverContent
        side="top"
        align="end"
        className="flex h-[min(460px,var(--radix-popover-content-available-height))] w-[min(420px,calc(100vw-2rem))] flex-col overflow-hidden p-0"
      >
        <div className="border-b border-border p-3">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder={gifProvider.searchPlaceholder}
              aria-label={gifProvider.searchPlaceholder}
              className="pl-9"
              autoFocus
            />
          </div>
          {!query && <p className="mt-2 text-xs font-semibold uppercase text-muted-foreground">Trending</p>}
        </div>

        <div className="min-h-0 flex-1">
          <GifGrid
            query={query}
            onPick={(gif) => {
              onPick(gif);
              setOpen(false);
              setSearch("");
            }}
          />
        </div>

        <p className="border-t border-border px-3 py-1.5 text-right text-[11px] font-medium text-muted-foreground">
          {gifProvider.attribution}
        </p>
      </PopoverContent>
    </Popover>
  );
}
