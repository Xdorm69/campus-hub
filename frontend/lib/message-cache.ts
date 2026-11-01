import { InfiniteData } from "@tanstack/react-query";
import { Message, MessagePage } from "@/types/message";

/**
 * Pure helpers for the chat history cache.
 *
 * Shape: `pages[0]` is the newest page and each later page is older. Inside a
 * page messages run oldest -> newest, so the newest message overall is the
 * last item of `pages[0]`.
 */
// Page params are opaque cursors these helpers never read.
export type MessagesData = InfiniteData<MessagePage, unknown>;

const time = (iso: string) => new Date(iso).getTime();

/** Flattens the cache into one oldest -> newest list for rendering. */
export function flattenMessages(data: MessagesData | undefined): Message[] {
  if (!data) return [];
  const ordered: Message[] = [];
  for (let i = data.pages.length - 1; i >= 0; i--) {
    ordered.push(...data.pages[i].messages);
  }
  return ordered;
}

export function findMessage(data: MessagesData | undefined, id: string) {
  for (const page of data?.pages ?? []) {
    const match = page.messages.find((message) => message.id === id);
    if (match) return match;
  }
  return undefined;
}

/** Maps every message; returning null removes it. */
export function mapMessages(
  data: MessagesData | undefined,
  fn: (message: Message) => Message | null
): MessagesData | undefined {
  if (!data) return data;

  return {
    ...data,
    pages: data.pages.map((page) => ({
      ...page,
      messages: page.messages.flatMap((message) => {
        const next = fn(message);
        return next ? [next] : [];
      }),
    })),
  };
}

export function updateMessage(
  data: MessagesData | undefined,
  id: string,
  fn: (message: Message) => Message
) {
  return mapMessages(data, (message) => (message.id === id ? fn(message) : message));
}

export function removeMessage(data: MessagesData | undefined, id: string) {
  return mapMessages(data, (message) => (message.id === id ? null : message));
}

/** Adds a message at the newest end (used for optimistic sends). */
export function appendMessage(data: MessagesData | undefined, message: Message): MessagesData {
  if (!data || data.pages.length === 0) {
    return {
      pages: [{ messages: [message], nextCursor: null, serverTime: new Date().toISOString() }],
      pageParams: [null],
    };
  }

  const [newest, ...older] = data.pages;
  return {
    ...data,
    pages: [{ ...newest, messages: [...newest.messages, message] }, ...older],
  };
}

/**
 * Swaps an optimistic message for the server copy. If polling already
 * delivered the real message, the placeholder is just dropped.
 */
export function resolveOptimisticMessage(
  data: MessagesData | undefined,
  tempId: string,
  message: Message
) {
  const alreadySynced = Boolean(findMessage(data, message.id));
  return mapMessages(data, (current) => {
    if (current.id !== tempId) return current;
    return alreadySynced ? null : message;
  });
}

/**
 * Merges a polling delta into the cache:
 *  - deleted messages are removed,
 *  - known messages are replaced if the incoming copy is at least as new,
 *  - unknown messages are added to the newest page, unless they're older than
 *    everything loaded (that history arrives via infinite scroll instead).
 */
export function applyMessageDelta(data: MessagesData | undefined, delta: Message[]) {
  if (!data || delta.length === 0) return data;

  const incoming = new Map(delta.map((message) => [message.id, message]));
  const seen = new Set<string>();

  let next = mapMessages(data, (current) => {
    const update = incoming.get(current.id);
    if (!update) return current;

    seen.add(current.id);
    if (update.deletedAt) return null;
    return time(update.updatedAt) >= time(current.updatedAt) ? update : current;
  })!;

  const oldestPage = next.pages[next.pages.length - 1];
  const hasOlderHistory = oldestPage.nextCursor !== null;
  const oldestLoaded = oldestPage.messages[0];

  const additions = delta.filter((message) => {
    if (seen.has(message.id) || message.deletedAt) return false;
    if (hasOlderHistory && oldestLoaded && time(message.createdAt) < time(oldestLoaded.createdAt)) {
      return false;
    }
    return true;
  });

  if (additions.length > 0) {
    const [newest, ...older] = next.pages;
    const merged = [...newest.messages, ...additions].sort((a, b) => {
      // Optimistic messages stay pinned to the bottom until they resolve.
      if (a.clientStatus && !b.clientStatus) return 1;
      if (b.clientStatus && !a.clientStatus) return -1;
      return time(a.createdAt) - time(b.createdAt);
    });
    next = { ...next, pages: [{ ...newest, messages: merged }, ...older] };
  }

  return next;
}
