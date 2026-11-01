# Real-time chat: polling + infinite scroll

Chat rooms feel live without a WebSocket server. Three pieces make this work:

1. **History** (`useMessages`): a TanStack `useInfiniteQuery` that loads **older** messages page by page as you scroll up.
2. **Sync** (`useMessageSync`): a poll every 4 seconds that asks the server what changed since the last poll, and patches just those messages into the history already loaded.
3. **Cache helpers** (`lib/message-cache.ts`): pure functions that edit the loaded history (merge a polling result, add or settle an instant-send placeholder, remove a message, and so on).

## Server side

### History: `GET /classes/:classId/messages?before=<id>&limit=30`

- Sorts by `_id` (newest first) and fetches `limit + 1` documents. The extra one shows whether an older page exists without a separate count query.
- Returns the page **oldest → newest**, plus:
  - `nextCursor`: the oldest message's id on this page, or `null` once you reach the start of the room.
  - `serverTime`: captured **before** the query runs, so anything written during the query is still caught by the first sync.

### Sync: `GET /classes/:classId/messages/sync?since=<ISO date>`

- Returns every message whose `updatedAt` is later than `since − 5s`, **including deleted ones**. Creating, editing, reacting and deleting all update `updatedAt`, so one query catches every kind of change.
- **Why the 5-second overlap:** a write sets `updatedAt` slightly before it becomes visible to other queries. Without the overlap, a poll could run in that gap and miss the change for good. The client matches messages by id, so getting a message twice does no harm.
- Returns at most 100 messages, along with `hasMore`. If `hasMore` is true, the client has fallen too far behind to patch, so it reloads the history from the latest page instead.
- Indexed by `(class, updatedAt)`.

## Client side

### Cache shape

```
InfiniteData<MessagePage>
pages[0]  = newest page   [m31 … m60]   ← new messages are appended here
pages[1]  = older page    [m1  … m30]   ← each page is oldest → newest
```

`flattenMessages()` walks the pages from last to first, giving one list ordered oldest → newest for rendering.

### `useMessageSync`

```ts
queryFn: async () => {
  const since = latest(previousSync?.serverTime, history.pages[0].serverTime);
  const delta = await messageService.sync(classId, since);
  if (delta.hasMore) resetQueries(history);              // too far behind: start over
  else setQueryData(history, old => applyMessageDelta(old, delta.messages));
  return { serverTime: delta.serverTime };               // this query's own data is just the time of the last poll
}
```

- `refetchInterval: 4000`, `refetchIntervalInBackground: false`: polling **pauses while the tab is hidden** and runs straight away when you return (`refetchOnWindowFocus: true`).
- The history query uses `staleTime: Infinity`. The poll keeps it current, so TanStack never re-downloads every loaded page.
- If a poll comes back 403 or 404 (you were banned or kicked, or the class was deleted), the hook refreshes the class details and the room switches to the matching screen.

### `applyMessageDelta(data, delta)`

| Incoming message                                     | Action                                          |
| ---------------------------------------------------- | ----------------------------------------------- |
| Has `deletedAt`                                      | Removed from the loaded history                 |
| Already loaded                                       | Replaced, unless the loaded copy is newer       |
| New, and newer than everything loaded                | Added to the newest page in time order          |
| New, but older than the oldest loaded message while more history exists | Ignored; scrolling up will load it |

Messages still being sent stay at the bottom until the server confirms them.

### Sending instantly

1. `onMutate` adds a placeholder (`id: temp-…`, `clientStatus: "sending"`) to the newest page. Image attachments show a local preview.
2. `onSuccess` calls `resolveOptimisticMessage`: if the poll already delivered the real message, the placeholder is removed; otherwise the placeholder is swapped for the server's copy. Either way the message never shows twice.
3. `onError` marks the placeholder `failed`. The message shows **Retry** (re-sends the saved payload) and **Discard**.

Edit, delete and reactions work the same way: change the screen immediately, then confirm with the server's copy or undo on error.

### Scrolling

`MessageList` puts the messages in a `flex-direction: column-reverse` scroll container. In that mode the browser keeps the view anchored to the bottom:

- The room opens on the latest message without any scroll code.
- New messages at the bottom keep you at the bottom.
- Older pages added at the top **don't move** the messages you're reading.
- `scrollTop` is `0` at the bottom and negative as you scroll up. Being "at the bottom" means `scrollTop > -120`.

An `IntersectionObserver` watches an invisible marker at the top, starting 600px early (`rootMargin: "600px 0 0 0"`), and calls `fetchNextPage()`. The observer is rebuilt every time a page finishes loading. If the marker is **still** on screen (for example, a short history on a tall screen), it immediately asks for the next page.

Other behaviour:

- When you're scrolled up and someone else posts, a **New messages** button appears; otherwise you get **Jump to present**.
- While you're at the bottom and the tab is visible, each new latest message calls `POST /classes/:id/read`, which clears the sidebar's unread badge straight away.
- Sending a message scrolls you to the bottom.

## Other polling

| Data                            | Hook             | Interval |
| ------------------------------- | ---------------- | -------- |
| Room messages                   | `useMessageSync` | 4 s      |
| Sidebar classes + unread counts | `useMyClasses`   | 15 s     |
| Class details (mute/ban state)  | `useClass`       | 30 s     |
| Member list                     | `useMembers`     | 30 s     |

The intervals are in `frontend/lib/constants.ts`. The API rate limit (300 requests per minute per IP) leaves room for a few open tabs.

## Moving to WebSockets later

To switch to WebSockets, keep the history query and `applyMessageDelta`. Swap `useMessageSync`'s timer for a socket listener that feeds incoming messages into the same `setQueryData(applyMessageDelta)` call. Keep the sync endpoint so a client that reconnects can catch up on what it missed.
