"use client";

import { useInfiniteQuery } from "@tanstack/react-query";
import { gifProvider } from "@/lib/gifs";
import { useProfile } from "./useProfile";

/**
 * Trending GIFs when `query` is empty, search results otherwise, with
 * infinite scrolling. Results are cached for a few minutes so reopening the
 * picker doesn't spend the provider's rate limit (100/hour on test keys).
 * Pass an already-debounced query.
 */
export function useGifSearch(query: string, enabled = true) {
  const { data: me } = useProfile();
  const trimmed = query.trim();

  return useInfiniteQuery({
    queryKey: ["gifs", gifProvider?.name, trimmed],
    queryFn: ({ pageParam, signal }) =>
      gifProvider!.fetchGifs({ query: trimmed, cursor: pageParam, customerId: me?.id, signal }),
    initialPageParam: null as string | null,
    getNextPageParam: (lastPage) => lastPage.next,
    enabled: enabled && gifProvider !== null,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    retry: 1,
  });
}
