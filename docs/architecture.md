# Architecture

CampusHub is two separate apps that talk over HTTP:

```
Next.js frontend (localhost:3000)  ──HTTP + cookie──▶  Express API (localhost:4000/api/v1)  ──▶  MongoDB
                                    ◀── /uploads/* ──  (files multer saved on disk)
```

The browser calls the API directly. The JWT is stored in an httpOnly `accessToken` cookie, so every request uses `withCredentials`.

## Backend

### Layers

Each feature in `backend/modules/<feature>/` has the same layers. A request goes through them top to bottom:

| Layer          | Job                                                                                 |
| -------------- | ----------------------------------------------------------------------------------- |
| `*.router.js`  | Defines routes and attaches middleware (auth, validation, uploads, id checks)       |
| `*.controller.js` | Reads `req`, calls the service, sends the response with `ApiResponse.send()`     |
| `*.service.js` | Business rules and permission checks; throws `ApiError` subclasses on failure       |
| `*.repository.js` | Mongoose queries only, using `.lean()` for reads                                 |
| `*.mapper.js`  | Turns a raw document into the JSON the API returns (`_id` → `id`, file paths → URLs, private fields removed) |
| `*.validator.js` | Zod schemas for the body, query string and form fields                            |

Modules:

- `auth`: register, login, logout.
- `user`: your profile, avatar, public profiles.
- `classes`: browse, create, edit, delete; join, leave, mark as read.
- `membership`: the single place that decides who may read, post or moderate in a class. Also handles moderation actions.
- `messages`: history, sync, send, edit, delete, reactions.

### Middleware order

`helmet → compression → cors → json → pino-http → cookie-parser → /uploads static → /api/v1 (rate limiter + routes) → 404 → error handler`

- **`authenticate`** checks the JWT, then loads the user from the database. Because of that lookup, a deleted account or a changed role takes effect on the very next request, not only when the token expires.
- **`validate(schema, source)`** checks the request against a Zod schema. A parsed body replaces `req.body`. A parsed query string goes to `req.validated.query`, because Express 5 doesn't allow `req.query` to be replaced. Failures are thrown so the error handler can deal with them.
- **`objectIdParam`** (attached with `router.param`) rejects malformed `:classId`, `:memberId`, `:messageId` and `:id` values with a 400.
- **`error.middleware`** converts known library errors into the API's error format: Mongoose cast and validation errors, duplicate-key (11000) errors, Multer errors, and malformed JSON. It also **deletes any files Multer already saved** for a request that failed.

Express 5 forwards errors thrown in async handlers to the error handler, so handlers don't need try/catch.

### Data model

```
User ──< Membership >── Class ──< Message
 │                                  │
 └──────────── author ──────────────┘
```

| Model        | Key fields                                                                                  | Indexes |
| ------------ | ------------------------------------------------------------------------------------------- | ------- |
| `User`       | `username`, `email`, `password` (hidden by default), `bio`, `avatarPath`, `role` (`USER`/`ADMIN`) | unique `username`, `email` |
| `Class`      | `code` (stored in upper case), `name`, `description`, `createdBy`, `lastMessageAt`          | unique `code`, `name` |
| `Membership` | `user`, `class`, `isModerator`, `muted`, `banned`, `lastReadAt`                            | unique `(user, class)`, `class` |
| `Message`    | `class`, `author`, `content`, `attachments[]`, `replyTo`, `reactions[{emoji, users[]}]`, `editedAt`, `deletedAt` | `(class, _id desc)`, `(class, updatedAt)` |

Design notes:

- **Member counts are calculated when requested** (an aggregation over non-banned memberships), not stored, so they can't drift out of sync.
- **Messages are soft-deleted.** Deleting sets `deletedAt` and clears the content, attachments and reactions, and the files are removed from disk. The emptied record stays behind so polling clients find out the message was deleted.
- **A ban is stored on the membership.** That's why a banned user can't leave the class: leaving deletes the membership, and the ban would go with it.
- **Files are stored as paths relative to `UPLOAD_DIR`.** Mappers build the public URL from `PUBLIC_URL` when responding, so moving the API to another host doesn't break existing links.
- **No transactions.** A standalone MongoDB doesn't support them, and no multi-document write here needs to be atomic.

### Uploads

`middleware/upload.middleware.js` sets up two Multer disk uploaders:

| Uploader      | Form field         | Folder                | Allowed types                     | Limits          |
| ------------- | ------------------ | --------------------- | --------------------------------- | --------------- |
| Attachments   | `files` (array)    | `uploads/attachments` | images, PDF, txt, zip, Office docs | 5 files × 10 MB |
| Avatar        | `avatar`           | `uploads/avatars`     | PNG, JPEG, GIF, WebP              | 1 file × 2 MB   |

Files are saved as `<uuid><ext>`, where the extension comes from the **MIME type**, never from the uploaded file name. Express serves `/uploads` as static files. Images are shown inline. Everything else is sent with `Content-Disposition: attachment`, so an uploaded document is downloaded and can never run as a page on the API's domain.

## Frontend

### Structure

| Folder        | Contents                                                                                     |
| ------------- | -------------------------------------------------------------------------------------------- |
| `app/`        | Routes. `(auth)` holds login and register; `(dashboard)` holds the signed-in app, guarded in `layout.tsx` by the `useProfile()` query |
| `components/` | `ui/` primitives (button, dialog, popover, avatar…) and `layout/` (AppShell, AppSidebar, PageHeader, UserPanel) |
| `features/`   | Feature components: `chat/`, `members/`, `classes/`, `profile/`, `auth/`                     |
| `hooks/`      | One file of TanStack Query hooks per resource, plus UI hooks (`useIntersectionObserver`, `useAutoResizeTextarea`, `useMediaQuery`, `useDebouncedValue`) |
| `services/`   | Typed wrappers around the axios client; they unwrap `ApiResponse<T>` and return `T`           |
| `lib/`        | `axios.ts` (converts errors to `ApiError`, redirects to login on 401), `query-keys.ts`, `message-cache.ts`, `constants.ts`, `format.ts` |

### Data flow

```
component ──▶ hook (useQuery / useMutation) ──▶ service ──▶ axios ──▶ API
    ▲                    │
    └── re-render ◀── TanStack Query cache ◀── optimistic updates / polling results
```

- **Query keys live in `lib/query-keys.ts`.** Chat messages use their own `["messages", classId, …]` keys, so refreshing a class's details or member list never re-downloads its chat history.
- **Mutations update the screen immediately** where it helps (join/leave, send/edit/delete/react) and undo the change if the server returns an error.
- **The chat screen shares state through `ChatContext`:** the message you're replying to, the message being edited, the composer's input element, and a scroll-to-bottom function. It's keyed by class ID, so this state resets when you switch rooms.

### Layout

```
┌──────────────┬───────────────────────────────────────┬──────────────┐
│ AppSidebar   │ ChatHeader (# name · description)     │              │
│  Home        ├───────────────────────────────────────┤  MemberList  │
│  Browse      │ MessageList (scrolls up for history)  │  Admins      │
│  YOUR CLASSES│                                       │  Moderators  │
│  # cs101  3  │                                       │  Members     │
│  # math201   │ MessageComposer                       │  Banned*     │
│ UserPanel    │                                       │              │
└──────────────┴───────────────────────────────────────┴──────────────┘
```

On small screens the sidebar becomes a slide-out drawer, and the member list becomes a panel that slides over the chat.
