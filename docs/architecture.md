# Architecture

CampusHub is two separate apps that talk over HTTP:

```
Next.js frontend (localhost:3000)  ──HTTP + cookie──▶  Express API (localhost:4000/api/v1)  ──▶  MongoDB
                                    ◀── /uploads/* ──  (files streamed from MongoDB GridFS)
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

`helmet → compression → cors → json → pino-http → cookie-parser → /uploads (GridFS files) → /api/v1 (rate limiter + routes) → 404 → error handler`

- **`authenticate`** checks the JWT, then loads the user from the database. Because of that lookup, a deleted account or a changed role takes effect on the very next request, not only when the token expires.
- **`validate(schema, source)`** checks the request against a Zod schema. A parsed body replaces `req.body`. A parsed query string goes to `req.validated.query`, because Express 5 doesn't allow `req.query` to be replaced. Failures are thrown so the error handler can deal with them.
- **`objectIdParam`** (attached with `router.param`) rejects malformed `:classId`, `:memberId`, `:messageId` and `:id` values with a 400.
- **`error.middleware`** converts known library errors into the API's error format: Mongoose cast and validation errors, duplicate-key (11000) errors, Multer errors, and malformed JSON.

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
- **Messages are soft-deleted.** Deleting sets `deletedAt` and clears the content, attachments and reactions, and the files are deleted from GridFS. The emptied record stays behind so polling clients find out the message was deleted.
- **A ban is stored on the membership.** That's why a banned user can't leave the class: leaving deletes the membership, and the ban would go with it.
- **Files are stored by key, not URL.** `attachments[].path` and `User.avatarPath` hold a GridFS key such as `6af3…e9.png`. Mappers build the public URL from `PUBLIC_URL` when responding, so moving the API to another host doesn't break existing links.
- **No transactions.** A standalone MongoDB doesn't support them, and no multi-document write here needs to be atomic.

### Uploads

Uploaded files are stored **in MongoDB itself** using GridFS (bucket `uploads`, i.e. the `uploads.files` and `uploads.chunks` collections), not on the server's disk. Hosts like Render, Railway and Heroku wipe the server's disk on every redeploy or restart, so files saved there disappear while messages still point at them.

How a file moves through the app:

1. `middleware/upload.middleware.js`: Multer **memory storage** checks the MIME type and size and keeps the file in memory. Nothing is written to disk, so a rejected request leaves nothing to clean up.
2. The service runs every check first (membership, mute, reply target). Only then does it call `saveUploads()` in `utils/files.js`, which writes the file to GridFS. If saving the message afterwards fails, the stored files are deleted again.
3. `modules/uploads` serves `GET /uploads/:key` by streaming the file out of GridFS with a long-lived `Cache-Control: immutable` header.

| Uploader      | Form field         | Allowed types                      | Limits          |
| ------------- | ------------------ | ---------------------------------- | --------------- |
| Attachments   | `files` (array)    | images, videos (MP4/WebM/MOV), PDF, txt, zip, Office docs | 5 files × 10 MB |
| Avatar        | `avatar`           | PNG, JPEG, GIF, WebP               | 1 file × 2 MB   |
| Banner        | `banner`           | PNG, JPEG, GIF, WebP               | 1 file × 3 MB   |
| Voice note    | `voice`            | WebM, Ogg, MP4/M4A, AAC, MP3 audio | 1 file × 1.5 MB, 2 min |

A file's key is `<GridFS ObjectId><ext>`, where the extension comes from the **MIME type**, never from the uploaded file name. Images and audio are shown inline, and the route supports HTTP `Range` requests so audio can seek (Safari won't play audio without them). Everything else is sent with `Content-Disposition: attachment`, so an uploaded document is downloaded and can never run as a page on the API's domain.

Storage counts toward your database size; Atlas's free M0 tier allows 512 MB in total. If you outgrow that, only `utils/files.js` needs to change to move files to S3 or Cloudinary.

### Voice notes & videos

Voice notes and videos are the easiest way to fill the database, so each is bounded in four ways. Videos are stored in their own GridFS folder (`video`), so images and documents don't count toward the video cap. The limits below are for voice notes; videos have the same set (`VIDEO_*`, 10 MB per video, 30 MB per user per day, 150 MB in total, 30 days). See [GIFs & videos](gifs-and-videos.md). GIFs are never stored: a message keeps only the provider's CDN URLs, and the backend accepts only URLs on that provider's hosts.

| Guard | Where | Default |
| ----- | ----- | ------- |
| Per note: size and length | `constants/upload.js` `VOICE_LIMITS`; the recorder stops itself at 2 minutes | 1.5 MB, 2 min |
| Per user: rolling 24 hours | `modules/messages/voice-quota.js` | `VOICE_DAILY_LIMIT_MB` = 5 |
| App-wide total | `modules/messages/media-quota.js`, summed over GridFS files tagged `metadata.folder: "voice"` | `VOICE_STORAGE_LIMIT_MB` = 100 |
| Retention | `jobs/voice-retention.job.js`, runs at startup and every hour | `VOICE_RETENTION_DAYS` = 30 |

The quota checks run before anything is stored. The retention job deletes the audio and sets `voiceNote.path = null` and `expiredAt`. The message stays in the chat as "voice message expired", and because its `updatedAt` changes, polling clients pick up the new state. With the defaults, voice notes can never use more than 100 MB and videos 150 MB, and space is freed continuously as old notes expire. Two notes sent at the same moment can each pass the check and overshoot a limit by at most one note, which is acceptable for a storage guard.

On the client, `hooks/useVoiceRecorder.ts` records with `MediaRecorder`: Opus at 32 kbps (about 240 KB per minute) where supported, or AAC/MP4 on Safari. `features/chat/VoicePlayer.tsx` shows the duration the recorder measured rather than the browser's, because WebM files from Chrome's recorder don't contain one. Recording needs a secure origin (https or localhost); where it isn't available, the mic button is hidden.

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
