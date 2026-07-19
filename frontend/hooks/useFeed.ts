"use client";

import { useInfiniteQuery } from "@tanstack/react-query";
import { postService } from "@/services/post.service";

export function useFeed(classId: string) {
  return useInfiniteQuery({
    queryKey: ["classes", classId, "feed"],
    queryFn: ({ pageParam }) => postService.getFeed(classId, pageParam),
    initialPageParam: null as string | null,
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    enabled: Boolean(classId),
  });
}
