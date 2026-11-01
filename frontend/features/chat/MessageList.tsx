"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ArrowDown, RotateCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useIntersectionObserver } from "@/hooks/useIntersectionObserver";
import { useMarkClassRead } from "@/hooks/useClasses";
import { useMessages, useMessageSync } from "@/hooks/useMessages";
import { MESSAGE_GROUP_WINDOW_MS } from "@/lib/constants";
import { isSameDay } from "@/lib/format";
import { flattenMessages } from "@/lib/message-cache";
import { cn } from "@/lib/utils";
import { Message } from "@/types/message";
import { useChat } from "./ChatContext";
import { ChatWelcome, DateDivider, MessageSkeletons } from "./ChatStates";
import { MessageItem } from "./MessageItem";

/** Within this many px of the bottom counts as "at the bottom". */
const BOTTOM_THRESHOLD = 120;

interface Row {
  message: Message;
  isGrouped: boolean;
  showDateDivider: boolean;
}

function buildRows(messages: Message[]): Row[] {
  return messages.map((message, index) => {
    const previous = messages[index - 1];
    const showDateDivider = !previous || !isSameDay(previous.createdAt, message.createdAt);
    const isGrouped =
      Boolean(previous) &&
      !showDateDivider &&
      previous.author?.id === message.author?.id &&
      !previous.clientStatus &&
      new Date(message.createdAt).getTime() - new Date(previous.createdAt).getTime() <
        MESSAGE_GROUP_WINDOW_MS;

    return { message, isGrouped, showDateDivider };
  });
}

/**
 * Scrollback with upward infinite scroll.
 *
 * The scroller is `flex-col-reverse`, so the browser anchors it to the
 * bottom: it opens on the latest message, stays pinned while new ones arrive,
 * and older pages prepended above don't shift what you're reading.
 * (In this mode scrollTop is 0 at the bottom and negative going up.)
 */
export function MessageList() {
  const { classRoom, me, scrollToBottomRef } = useChat();
  const scrollerRef = useRef<HTMLDivElement>(null);
  const [isAtBottom, setIsAtBottom] = useState(true);
  const [hasUnseen, setHasUnseen] = useState(false);

  const { data, isLoading, isError, refetch, fetchNextPage, hasNextPage, isFetchingNextPage } =
    useMessages(classRoom.id);
  useMessageSync(classRoom.id, Boolean(data));
  const markRead = useMarkClassRead(classRoom.id);

  const messages = useMemo(() => flattenMessages(data), [data]);
  const rows = useMemo(() => buildRows(messages), [messages]);
  const latest = messages[messages.length - 1];

  const loadOlder = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) fetchNextPage();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  const topSentinelRef = useIntersectionObserver<HTMLDivElement>(loadOlder, {
    root: scrollerRef,
    rootMargin: "600px 0px 0px 0px",
    enabled: Boolean(hasNextPage) && !isFetchingNextPage,
  });

  const scrollToBottom = useCallback((behavior: ScrollBehavior = "smooth") => {
    scrollerRef.current?.scrollTo({ top: 0, behavior });
    setHasUnseen(false);
  }, []);

  useEffect(() => {
    scrollToBottomRef.current = () => scrollToBottom("auto");
    return () => {
      scrollToBottomRef.current = null;
    };
  }, [scrollToBottomRef, scrollToBottom]);

  const handleScroll = () => {
    const scroller = scrollerRef.current;
    if (!scroller) return;
    const atBottom = scroller.scrollTop > -BOTTOM_THRESHOLD;
    setIsAtBottom(atBottom);
    if (atBottom) setHasUnseen(false);
  };

  // New message from someone else while you're scrolled up → show the pill.
  // While at the bottom, keep the server's read marker current instead.
  const latestId = latest?.id;
  const latestIsMine = latest?.author?.id === me.id;
  useEffect(() => {
    if (!latestId || latestId.startsWith("temp-")) return;

    if (!isAtBottom) {
      if (!latestIsMine) setHasUnseen(true);
      return;
    }
    if (document.visibilityState === "visible") markRead.mutate();
    // markRead is stable enough; re-running on its identity would spam the API.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [latestId, isAtBottom]);

  if (isLoading) {
    return (
      <div className="flex min-h-0 flex-1 flex-col justify-end overflow-hidden">
        <MessageSkeletons />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-3 text-center">
        <p className="text-muted-foreground">Couldn&apos;t load messages.</p>
        <Button variant="secondary" size="sm" onClick={() => refetch()}>
          <RotateCw className="h-4 w-4" /> Try again
        </Button>
      </div>
    );
  }

  return (
    <div className="relative min-h-0 flex-1">
      <div
        ref={scrollerRef}
        onScroll={handleScroll}
        className="flex h-full flex-col-reverse overflow-y-auto overflow-x-hidden"
      >
        <div className="flex flex-col pb-6">
          <div ref={topSentinelRef} aria-hidden className="h-px" />

          {hasNextPage ? (
            isFetchingNextPage && <MessageSkeletons count={3} />
          ) : (
            <ChatWelcome classRoom={classRoom} />
          )}

          {rows.map(({ message, isGrouped, showDateDivider }) => (
            <div key={message.id}>
              {showDateDivider && <DateDivider date={message.createdAt} />}
              <MessageItem message={message} isGrouped={isGrouped} />
            </div>
          ))}
        </div>
      </div>

      {!isAtBottom && (
        <button
          type="button"
          onClick={() => scrollToBottom()}
          className={cn(
            "absolute bottom-3 left-1/2 flex -translate-x-1/2 items-center gap-2 rounded-full px-4 py-1.5 text-sm font-medium shadow-lg transition-colors",
            hasUnseen
              ? "bg-primary text-primary-foreground hover:bg-primary/90"
              : "bg-card text-foreground ring-1 ring-border hover:bg-accent"
          )}
        >
          {hasUnseen ? "New messages" : "Jump to present"}
          <ArrowDown className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}
