"use client";

import { useEffect, useRef } from "react";
import { MessageSquare } from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { PostCard } from "@/components/classes/PostCard";
import { useFeed } from "@/hooks/useFeed";
import { useProfile } from "@/hooks/useProfile";

export function Feed({ classId }: { classId: string }) {
  const { data: me } = useProfile();
  const {
    data,
    isLoading,
    isError,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useFeed(classId);

  const sentinelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const node = sentinelRef.current;
    if (!node) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) {
          fetchNextPage();
        }
      },
      { rootMargin: "200px" }
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [fetchNextPage, hasNextPage, isFetchingNextPage]);

  if (isLoading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-24 w-full" />
      </div>
    );
  }

  if (isError) {
    return (
      <EmptyState
        icon={MessageSquare}
        title="Couldn't load the feed"
        description="Refresh the page to try again."
      />
    );
  }

  const posts = data?.pages.flatMap((page) => page.posts) ?? [];

  if (posts.length === 0) {
    return (
      <EmptyState
        icon={MessageSquare}
        title="No posts yet"
        description="Be the first to share something with this class."
      />
    );
  }

  return (
    <div className="space-y-3">
      {posts.map((post) => (
        <PostCard key={post.id} post={post} classId={classId} isOwn={post.authorId === me?.id} />
      ))}

      <div ref={sentinelRef} className="h-1" />

      {isFetchingNextPage && <Skeleton className="h-24 w-full" />}
    </div>
  );
}
