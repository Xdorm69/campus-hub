# Configuration

## Backend: `backend/.env`

| Variable               | Default                                   | Notes |
| ---------------------- | ----------------------------------------- | ----- |
| `PORT`                 | `4000`                                    | |
| `NODE_ENV`             | `local`                                   | `production` turns on secure cross-site cookies, hides the details of 500 errors and switches to plain JSON logs |
| `LOG_LEVEL`            | `info`                                    | Pino log level |
| `MONGODB_URI`          | `mongodb://127.0.0.1:27017/campushub`     | End it with a database name, or MongoDB uses `test` |
| `JWT_SECRET`           | **required**                              | The server won't start without it. Generate one with `node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"` |
| `JWT_EXPIRES_IN_HOURS` | `168` (7 days)                            | Controls both the token's expiry and the cookie's `maxAge` |
| `BCRYPT_ROUNDS`        | `10`                                      | |
| `FRONTEND_URL`         | `http://localhost:3000`                   | The only origin CORS allows (credentials enabled) |
| `PUBLIC_URL`           | `http://localhost:${PORT}`                | The API's public address, used to build links to uploaded files. **Must be set in production** (e.g. `https://your-api.onrender.com`, no `/api/v1`), or every image link points at localhost. A warning is logged at startup if it's missing |
| `SEED_ADMIN_EMAIL`     | none                                      | Used by `pnpm seed` |
| `SEED_ADMIN_PASSWORD`  | none                                      | Used by `pnpm seed` |
| `SEED_ADMIN_USERNAME`  | `admin`                                   | Used by `pnpm seed` |

## Frontend: `frontend/.env`

| Variable              | Default                          | Notes |
| --------------------- | -------------------------------- | ----- |
| `NEXT_PUBLIC_API_URL` | `http://localhost:4000/api/v1`   | Must end in `/api/v1` |

Polling intervals, page size and upload limits are set in `frontend/lib/constants.ts`. Keep the upload limits there in line with `backend/constants/upload.js`.

## Limits

| What                        | Limit |
| --------------------------- | ----- |
| Auth rate limit             | 10 register/login attempts per 15 min per IP |
| API rate limit              | 300 requests per minute per IP |
| JSON body                   | 100 KB |
| Message length              | 4000 characters |
| Attachments per message     | 5 files, 10 MB each |
| Avatar                      | 2 MB; PNG, JPEG, GIF or WebP |
| Different reactions per message | 20 |
| Username                    | 3–20 characters: letters, numbers, `_` |
| Password                    | 8–64 characters |
| Bio                         | 280 characters |
| Class code / name / description | 3–12 characters (`A-Z 0-9 -`, stored upper case) / 2–60 / 500 |
| Messages per page / per sync | 30 by default (max 100) / 100 |

The rate limiter keeps its counts in memory, so restarting the API resets them.

## Deployment notes

- **Cookies across sites:** with `NODE_ENV=production` the cookie is `Secure; SameSite=None`, so the API **must be served over HTTPS**. If the frontend and API share a parent domain, consider changing the cookie to `SameSite=Lax`.
- **Behind a proxy:** `app.set("trust proxy", 1)` assumes exactly one reverse proxy in front of the API. Change it if your setup differs, otherwise rate limiting may see the wrong client IP.
- **Uploads are stored in MongoDB (GridFS),** so they survive redeploys and restarts on hosts with temporary disks (Render, Railway, Heroku). They count toward your database size: Atlas's free tier allows 512 MB in total.
- **Uploads are public by URL:** anyone with a file's link can open it. Keys are random ObjectIds, so links are hard to guess, but they aren't checked against class membership. If attachments must be members-only, add `authenticate` and a membership check to `modules/uploads`.
- **Several API instances:** move the rate-limiter counts to a shared store (e.g. Redis). Uploads already live in the shared database.
- **Indexes:** Mongoose creates indexes automatically when the app starts. In production you may prefer to turn `autoIndex` off and create them once with `Model.syncIndexes()` (as `pnpm seed` does).
