# API reference

Base URL: `http://localhost:4000/api/v1`

Every route except `/auth/*` and `/health` requires the `accessToken` cookie, which login and register set. Send requests with credentials (`withCredentials: true` / `credentials: "include"`).

## Response format

Successful responses:

```json
{ "success": true, "statusCode": 200, "message": "Class fetched successfully", "data": { } }
```

Errors:

```json
{ "success": false, "type": "ZodValidationError", "message": "Username must be at least 3 characters",
  "errors": [{ "field": "username", "message": "Username must be at least 3 characters" }] }
```

`errors` is only included for validation failures.

| Status | `type` examples                              | When |
| ------ | -------------------------------------------- | ---- |
| 400    | `ZodValidationError`, `BadRequestError`, `UploadError` | Invalid input, malformed id, file type not allowed |
| 401    | `UnauthorizedError`                          | Missing or expired cookie, wrong credentials |
| 403    | `ForbiddenError`                             | Not a member, muted, banned, not a moderator |
| 404    | `NotFoundError`                              | Unknown resource or route |
| 409    | `ConflictError`                              | Duplicate email, username, class code or name; already a member |
| 413    | `UploadError`, `VoiceNoteTooLarge`, `VideoTooLarge` | File too large |
| 416    | `RangeNotSatisfiable`                        | Byte range outside the file (`/uploads`) |
| 429    | `RateLimit`, `VoiceQuotaExceeded`, `VideoQuotaExceeded` | Too many requests; daily voice/video allowance used up |
| 507    | `VoiceStorageFull`, `VideoStorageFull`       | App-wide voice/video storage cap reached |

## Shared shapes

```ts
UserSummary  { id, username, avatarUrl: string | null, role: "USER" | "ADMIN" }
UserProfile  UserSummary & { bio, createdAt, email?, verified? }   // email/verified only for yourself or admins

ClassRoom {
  id, code, name, description, memberCount, lastMessageAt, createdAt,
  isMember, isModerator, isMuted, isBanned, canModerate,   // relative to the user making the request
  unreadCount?                                              // only in /users/me/classes
}

ClassMember { id, userId, user: UserSummary & { bio }, isModerator, muted, banned, joinedAt }

Message {
  id, classId, author: UserSummary | null, content,
  attachments: { id, url: string | null, name, mimeType, size, isExpired }[],          // videos expire
  voiceNote: { url: string | null, mimeType, size, durationMs, isExpired } | null,   // url is null once expired
  gif: { provider, providerId, title, url, previewUrl, width, height } | null,       // provider-hosted
  replyTo: { id, author, content, hasAttachments, hasVoiceNote, hasGif, isDeleted } | null,
  reactions: { emoji, count, userIds }[],
  editedAt, deletedAt, createdAt, updatedAt
}
```

---

## Health

| Method | Path      | Response |
| ------ | --------- | -------- |
| GET    | `/health` | `{ success: true, status: "ok" }` (not wrapped in the standard envelope) |

## Auth

| Method | Path             | Body                              | Returns |
| ------ | ---------------- | --------------------------------- | ------- |
| POST   | `/auth/register` | `{ username, email, password }`   | `201 { user }` and sets the cookie |
| POST   | `/auth/login`    | `{ email, password }`             | `200 { user }` and sets the cookie |
| POST   | `/auth/logout`   | —                                 | Clears the cookie |

Register and login share a rate limit of 10 attempts per 15 minutes per IP.

## Users

| Method | Path                | Body / form               | Returns |
| ------ | ------------------- | ------------------------- | ------- |
| GET    | `/users/me`         | —                         | Your profile (includes `email`, `verified`) |
| PATCH  | `/users/me`         | `{ username?, bio? }`     | Updated profile |
| PUT    | `/users/me/avatar`  | multipart, field `avatar` | Updated profile |
| DELETE | `/users/me/avatar`  | —                         | Updated profile (`avatarUrl: null`) |
| GET    | `/users/me/classes` | —                         | `ClassRoom[]` for classes you've joined, sorted by name, with `unreadCount` (counts above 99 are reported as 100) |
| GET    | `/users/:id`        | —                         | `UserProfile` |

## Classes

| Method | Path                         | Who            | Body / query                       | Returns |
| ------ | ---------------------------- | -------------- | ---------------------------------- | ------- |
| GET    | `/classes`                   | anyone         | `?search=` (matches name, code or description) | `ClassRoom[]` |
| GET    | `/classes/:classId`          | anyone         | —                                  | `ClassRoom` |
| POST   | `/classes`                   | admin          | `{ code, name, description? }`     | `201 ClassRoom` (creator joins as moderator) |
| PATCH  | `/classes/:classId`          | admin          | `{ name?, description? }`          | `ClassRoom` |
| DELETE | `/classes/:classId`          | admin          | —                                  | `{ id }`; deletes members, messages and files too |
| POST   | `/classes/:classId/join`     | anyone not banned | —                               | `201 ClassMember` |
| POST   | `/classes/:classId/leave`    | member, not banned | —                              | `{ classId }` |
| POST   | `/classes/:classId/read`     | member         | —                                  | `{ classId, lastReadAt }` |

## Members & moderation

| Method | Path                                   | Who          | Body | Returns |
| ------ | -------------------------------------- | ------------ | ---- | ------- |
| GET    | `/classes/:classId/members`            | anyone not banned | — | `ClassMember[]` |
| PATCH  | `/classes/:classId/members/:userId`    | moderator / admin | `{ isMuted?, isBanned?, role?: "MEMBER" \| "MODERATOR" }` | `ClassMember` |
| DELETE | `/classes/:classId/members/:userId`    | moderator / admin | — | `{ id, userId }` (kick) |

Members are identified by **user id**. See [permissions](permissions.md) for who can act on whom.

## Messages

### History (infinite scroll)

`GET /classes/:classId/messages?before=<messageId>&limit=30`

- `limit`: 1–100, default 30.
- Leave out `before` to get the latest page.

```json
{ "messages": [/* oldest → newest */], "nextCursor": "6ae0…" , "serverTime": "2026-10-27T07:10:15.813Z" }
```

`nextCursor` is `null` once you reach the first message in the room.

### Sync (polling)

`GET /classes/:classId/messages/sync?since=<ISO date>`

```json
{ "messages": [/* created, edited, reacted-to or deleted since `since` */], "hasMore": false, "serverTime": "…" }
```

- Deleted messages are included with `deletedAt` set (and empty content) so clients can remove them.
- Pass the returned `serverTime` as `since` on the next poll.
- If `hasMore` is `true`, more than 100 messages changed; reload the history instead.
- The server re-checks 5 seconds before `since`, so you may get a message you already have. Match messages by `id`.

Full design: [realtime-chat.md](realtime-chat.md).

### Send

`POST /classes/:classId/messages`, sent as **multipart/form-data** (or JSON if there are no files)

| Field     | Type                 | Notes |
| --------- | -------------------- | ----- |
| `content` | string               | Up to 4000 characters. Can be empty if files are attached |
| `replyTo` | message id           | Optional; must be a message in the same class that hasn't been deleted |
| `files`   | file (repeat the field) | Up to 5, 10 MB each: PNG/JPEG/GIF/WebP, MP4/WebM/MOV video, PDF, TXT, ZIP, DOC(X), XLS(X), PPT(X). Videos count toward the video limits |
| `gif`     | object (JSON body only) | `{ provider: "klipy" | "giphy", providerId, title, url, previewUrl, width, height }` from the GIF picker. Every URL must be `https` on that provider's CDN. Can't be combined with `content`, `files` or `voice` |
| `voice`   | file                 | A voice note: WebM, Ogg, MP4/M4A, AAC or MP3 audio, up to 1.5 MB. A codec suffix such as `audio/webm;codecs=opus` is fine |
| `voiceDurationMs` | number       | Required with `voice`; up to 120000 (2 minutes) |

Returns `201 Message`. Muted, banned and non-member users get 403.

**Voice messages stand alone:** a request with `voice` can't also carry `content` or `files`, and voice messages can't be edited. Before anything is stored, the server checks each limit in turn:

| Check | Default | Error |
| ----- | ------- | ----- |
| Size of this note | 1.5 MB | `413 VoiceNoteTooLarge` |
| Sender's voice notes in the last 24 hours | `VOICE_DAILY_LIMIT_MB` = 5 MB | `429 VoiceQuotaExceeded` |
| All stored voice notes in the app | `VOICE_STORAGE_LIMIT_MB` = 100 MB | `507 VoiceStorageFull` |

After `VOICE_RETENTION_DAYS` (default 30) the audio is deleted. The message stays, with `voiceNote.isExpired: true` and `url: null`.

```bash
curl -b cookies.txt -F "content=Notes for week 3" -F "files=@notes.pdf" \
  http://localhost:4000/api/v1/classes/<classId>/messages

curl -b cookies.txt -F "voice=@note.webm;type=audio/webm" -F "voiceDurationMs=8000" \
  http://localhost:4000/api/v1/classes/<classId>/messages
```

### Edit, delete, react

| Method | Path                               | Body               | Who | Returns |
| ------ | ---------------------------------- | ------------------ | --- | ------- |
| PATCH  | `/messages/:messageId`             | `{ content }`      | Author (not muted); not voice messages | `Message` with `editedAt` set |
| DELETE | `/messages/:messageId`             | —                  | Author, moderator, admin | `Message` with `deletedAt` set (soft delete; files removed) |
| PUT    | `/messages/:messageId/reactions`   | `{ emoji }`        | Member | `Message`; adds your reaction, or removes it if already there |

`emoji` must contain an emoji character (up to 16 characters). A message can have at most 20 different reactions.

## Uploaded files

Files are served from `GET /uploads/<key>` on the API's address (outside `/api/v1` and its rate limit), where `key` is `<ObjectId><ext>`, e.g. `/uploads/6af3c1d2e4b5a6978f0e1d2c.png`. Files are streamed from MongoDB GridFS and cached by browsers for a year (`immutable`). Images and audio are shown inline; all other types are sent as downloads with their original filename. HTTP `Range` requests are supported (`206 Partial Content`), which `<audio>` players need for seeking and Safari needs to play at all. An unknown or expired key returns `404`.
