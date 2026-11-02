# CampusHub

A chat app for university classes, styled after Discord and Slack. Every class is a chat room where students can talk, share files, reply to and react to messages. Moderators and admins keep each room in order.

- **Backend:** Express 5 · MongoDB (Mongoose) · Multer + GridFS uploads · JWT in an httpOnly cookie · Zod · Pino
- **Frontend:** Next.js 16 (App Router) · React 19 · TanStack Query · Tailwind CSS · Radix UI · React Hook Form

## Features

- **Chat rooms per class:** message history loads as you scroll up, and new messages arrive by polling (no WebSocket server needed). Messages support simple formatting (`**bold**`, `*italic*`, `` `code` ``, code blocks, links).
- **Messages:** send, edit, delete, reply, emoji reactions, and file/image attachments (paste an image to attach it). A failed send can be retried.
- **Unread badges** in the sidebar, cleared once you've read the room.
- **Classes:** browse and search, join and leave. Admins create, edit and delete classes.
- **Moderation:** mute, ban, kick, and promote or demote moderators. Rules are enforced on the server ([permissions](docs/permissions.md)).
- **Profiles:** avatar upload, bio, and a profile card that opens when you click a name.
- Dark and light themes, and a layout that works on mobile.

## Quick start

**Prerequisites:** Node.js 20+, pnpm (`corepack enable`), and a MongoDB database (local, Docker or Atlas).

```bash
# 1. Backend
cd backend
cp .env.example .env            # set MONGODB_URI and JWT_SECRET at minimum
pnpm install
pnpm seed                       # creates the admin from SEED_ADMIN_* plus 3 starter classes
pnpm dev                        # http://localhost:4000

# 2. Frontend (in a second terminal)
cd frontend
cp .env.example .env            # NEXT_PUBLIC_API_URL=http://localhost:4000/api/v1
pnpm install
pnpm dev                        # http://localhost:3000
```

Log in with the seeded admin account, or register a normal account at `/register`.

> Put a database name at the end of `MONGODB_URI` (e.g. `.../campushub`). If you leave it out, MongoDB uses a database called `test`.

## Scripts

| Location    | Command      | What it does                               |
| ----------- | ------------ | ------------------------------------------ |
| `backend/`  | `pnpm dev`   | API with auto-reload (nodemon)             |
| `backend/`  | `pnpm start` | API in production mode                     |
| `backend/`  | `pnpm seed`  | Create or promote the admin, add starter classes (safe to run again) |
| `frontend/` | `pnpm dev`   | Next.js dev server                         |
| `frontend/` | `pnpm build` | Production build                           |
| `frontend/` | `pnpm start` | Serve the production build                 |

## Project layout

```
Campus_Hub/
├── backend/
│   ├── config/        env, MongoDB connection, CORS, logger
│   ├── constants/     roles, upload limits & allowed file types
│   ├── middleware/    authenticate, authorize, validate, upload (multer), errors
│   ├── models/        Mongoose schemas: User, Class, Membership, Message
│   ├── modules/       one folder per feature: router → controller → service → repository (+ mapper, validator)
│   ├── routes/        mounts the module routers under /api/v1
│   ├── scripts/       seed.js
│   └── src/           app.js (Express setup), server.js (startup + shutdown)
├── frontend/
│   ├── app/           routes: (auth)/login, (auth)/register, (dashboard)/…
│   ├── components/    shared UI primitives and the app shell (sidebar, headers)
│   ├── features/      feature UI: chat, members, classes, profile, auth
│   ├── hooks/         TanStack Query hooks + small UI hooks
│   ├── lib/           axios client, query keys, message-cache helpers, formatting
│   ├── services/      thin typed API wrappers
│   └── types/         shared TypeScript types matching the API's response shapes
└── docs/
```

## Documentation

| Doc                                            | Covers                                                 |
| ---------------------------------------------- | ------------------------------------------------------ |
| [Architecture](docs/architecture.md)           | How the backend and frontend are organised, data model, request flow |
| [Real-time chat](docs/realtime-chat.md)        | How polling and infinite scroll work together          |
| [API reference](docs/api.md)                   | Every endpoint, with request and response shapes       |
| [Permissions](docs/permissions.md)             | Roles and who is allowed to do what                    |
| [Configuration](docs/configuration.md)         | Environment variables, limits, deployment notes        |
