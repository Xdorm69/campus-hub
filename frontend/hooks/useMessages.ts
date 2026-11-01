"use client";

import { useEffect } from "react";
import { useInfiniteQuery, useQuery, useQueryClient } from "@tanstack/react-query";
import { messageService } from "@/services/message.service";
import { queryKeys } from "@/lib/query-keys";
import { POLL_INTERVALS } from "@/lib/constants";
import { ApiError } from "@/lib/api-error";
import { applyMessageDelta, MessagesData } from "@/lib/message-cache";

/**
 * Chat history, newest page first. `fetchNextPage` loads *older* messages
 * (infinite scroll upward). New messages arrive through `useMessageSync`,
 * which patches this cache in place, so the history itself never goes stale
 * and never refetches every loaded page.
 */
export function useMessages(classId: string, enabled = true) {
  return useInfiniteQuery({
    queryKey: queryKeys.messages.list(classId),
    queryFn: ({ pageParam }) => messageService.list(classId, pageParam),
    initialPageParam: null as string | null,
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    enabled: Boolean(classId) && enabled,
    staleTime: Infinity,
  });
}

interface SyncState {
  serverTime: string;
  received: number;
}

const latest = (...times: (string | undefined)[]) =>
  times
    .filter((t): t is string => Boolean(t))
    .reduce<string | undefined>((max, t) => (!max || t > max ? t : max), undefined);

/**
 * Polls `/messages/sync` for anything created, edited, reacted to or deleted
 * since the last poll and merges it into the history cache.
 *
 * The query's own data is just the sync cursor (server time of the last
 * poll). TanStack pauses the interval while the tab is hidden and fires
 * immediately when the user comes back.
 */
export function useMessageSync(classId: string, enabled = true) {
  const queryClient = useQueryClient();
  const listKey = queryKeys.messages.list(classId);
  const syncKey = queryKeys.messages.sync(classId);

  const query = useQuery({
    queryKey: syncKey,
    enabled: Boolean(classId) && enabled,
    refetchInterval: POLL_INTERVALS.MESSAGES,
    refetchIntervalInBackground: false,
    refetchOnWindowFocus: true,
    staleTime: 0,
    retry: false,
    queryFn: async ({ signal }): Promise<SyncState | null> => {
      const history = queryClient.getQueryData<MessagesData>(listKey);
      const previous = queryClient.getQueryData<SyncState | null>(syncKey);

      // History reset (or not loaded yet) → its first page's server time
      // is the right starting point; otherwise continue from the last poll.
      const since = latest(previous?.serverTime, history?.pages[0]?.serverTime);
      if (!history || !since) return previous ?? null;

      const delta = await messageService.sync(classId, since, signal);

      if (delta.hasMore) {
        // Fell too far behind to patch; start over from the latest page.
        await queryClient.resetQueries({ queryKey: listKey, exact: true });
      } else if (delta.messages.length > 0) {
        queryClient.setQueryData<MessagesData>(listKey, (old) =>
          applyMessageDelta(old, delta.messages)
        );
      }

      return { serverTime: delta.serverTime, received: delta.messages.length };
    },
  });

  // Lost access mid-session (banned/kicked/class deleted): refresh the class
  // so the room swaps to the right empty state.
  const lostAccess =
    query.error instanceof ApiError && [403, 404].includes(query.error.status);

  useEffect(() => {
    if (lostAccess) {
      queryClient.invalidateQueries({ queryKey: queryKeys.classes.detail(classId) });
    }
  }, [lostAccess, classId, queryClient]);

  return query;
}

export {
  useSendMessage,
  useEditMessage,
  useDeleteMessage,
  useToggleReaction,
  useDiscardFailedMessage,
} from "./useMessageMutations";
