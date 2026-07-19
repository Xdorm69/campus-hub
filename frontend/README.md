# CampusHub — MVP (Auth + Profile)

This is milestone 1 of CampusHub: project setup, authentication, and profile
management. Classes, feeds, posts, and moderation are not built yet — the
dashboard has a placeholder card where the classes feature will go.

## Stack

Next.js 15 (App Router) · TypeScript · Tailwind CSS · shadcn-style components
· TanStack Query · React Hook Form + Zod · Axios

## Setup

```bash
npm install
cp .env.example .env.local   # then edit values to match your backend
npm run dev
```

Open http://localhost:3000.

## Assumptions to double-check against your backend

- **Auth endpoints**: the provided spec only listed `/users/me`. This MVP
  assumes your backend exposes `POST /auth/login`, `POST /auth/register`,
  and `POST /auth/logout`, each setting/clearing the HTTP-only JWT cookie.
  Adjust `services/auth.service.ts` if your paths differ.
- **Cookie name**: `middleware.ts` checks for a cookie named `token` (via
  `AUTH_COOKIE_NAME`) to decide whether a route is protected. Set this to
  whatever your backend actually names the cookie, or the redirect logic
  won't work correctly.
- **Register response**: assumed to return `{ user }` just like login. If
  your backend requires email verification instead of logging the user in
  immediately, `useRegister` will need a different success path.

## What's in this milestone

- `/login`, `/register` — forms with Zod validation, error states, loading
  states
- `/` (dashboard) — protected, shows a welcome message
- `/profile` — view + edit username, avatar URL, bio
- `middleware.ts` — redirects unauthenticated users to `/login` and signed-in
  users away from the auth pages
- `lib/axios.ts` — shared instance with credentials + 401/403/404/network
  handling
- `hooks/useAuth.ts`, `hooks/useProfile.ts` — TanStack Query hooks
- `components/ui/*` — Button, Input, Label, Card, Avatar, Skeleton

## Next milestones (per the original plan)

1. Dashboard layout & navigation — done
2. Classes list + join/leave
3. Class details page + feed (pagination/infinite scroll)
4. Posts (create/edit/delete)
5. Moderation (mute/ban/promote)
6. Polish, loading/error states across the board
