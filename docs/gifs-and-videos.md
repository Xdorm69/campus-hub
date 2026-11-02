# GIFs & videos

## GIFs (Discord-style picker)

The composer's **GIF** button opens a search popover with trending GIFs, search and infinite scroll. Picking a GIF sends it as its own message.

**GIFs use no storage.** A GIF message stores only the provider's media URLs. The GIF itself always loads from the provider's CDN, which both providers' terms require.

### Which provider?

| Provider | Cost | Limits | Notes |
| -------- | ---- | ------ | ----- |
| **[KLIPY](https://klipy.com/developers)** (default) | Free | Test key: 100 requests/hour. Production: unlimited, after a free approval in the Partner Panel | What Discord moved to after Tenor shut down |
| [GIPHY](https://developers.giphy.com/) | Free beta key for development | Beta key: roughly 100 requests/hour. Production needs GIPHY's approval and may be paid | Requires "Powered by GIPHY" attribution |
| ~~Tenor~~ | — | — | Google shut down the Tenor API on **June 30, 2026** |

### Setup (about 5 minutes)

1. Sign in at **[partner.klipy.com](https://partner.klipy.com)**.
2. Go to **API Keys**, add your platform (web), and click **Create Key**.
3. Put the key in `frontend/.env`:

   ```env
   NEXT_PUBLIC_GIF_PROVIDER=klipy
   NEXT_PUBLIC_GIF_API_KEY=your-klipy-key
   ```

4. Restart `pnpm dev`. Next.js only reads `NEXT_PUBLIC_*` variables at startup and build time.
5. **Before launch:** request **Production access** in the KLIPY Partner Panel. Test keys stop working past 100 requests/hour, and each person opening the picker or scrolling uses a few requests.
6. **Deploying:** add the same two variables to your frontend host (e.g. Vercel → Settings → Environment Variables) and redeploy.

To use GIPHY instead, set `NEXT_PUBLIC_GIF_PROVIDER=giphy` and use a key from [developers.giphy.com/dashboard](https://developers.giphy.com/dashboard/). Nothing else changes. With no key set, the GIF button is simply hidden.

### Why the key is in the frontend

Both KLIPY and GIPHY require search requests to come **from the user's browser**. Routing them through your own server needs written approval from the provider. Their keys are designed to be public, the same way their own SDKs work. The picker also follows KLIPY's integration rules:

- The search box placeholder reads **"Search KLIPY"** (required by KLIPY).
- Results are shown in the order returned, unfiltered (required). Content filtering is done by the provider: KLIPY `content_filter=medium`, GIPHY `rating=pg-13`. You can tighten it further in the KLIPY Partner Panel.
- Media URLs are used exactly as returned and never re-hosted (required).
- "Powered by KLIPY" is shown under the results (optional, but nice).

### How it's built

| Piece | File |
| ----- | ---- |
| Provider interface | `frontend/lib/gifs/types.ts` |
| KLIPY / GIPHY adapters | `frontend/lib/gifs/providers/*.ts` |
| Chooses the provider from env | `frontend/lib/gifs/index.ts` |
| Search + infinite scroll hook (5 min cache to save rate limit) | `frontend/hooks/useGifSearch.ts` |
| Picker popover | `frontend/features/chat/GifPicker.tsx` |
| GIF in a message | `frontend/features/chat/MessageGif.tsx` |
| Looping playback, paused while off screen, respects "reduce motion" | `frontend/components/ui/autoplay-media.tsx` |
| Allowed CDN hosts per provider | `backend/constants/gifs.js` |

**Security:** a client could try to send a "GIF" pointing at any URL, for example a tracking pixel. The backend rejects it unless every URL is `https` on the chosen provider's CDN (`static*.klipy.com`, or `media*.giphy.com` / `i.giphy.com`).

**Adding another provider:** write an adapter that implements `GifProvider`, add it to the `switch` in `lib/gifs/index.ts`, and add its CDN hosts to `backend/constants/gifs.js`.

## Small videos

Videos are ordinary attachments: drag them in, paste them, or use **+**. Supported formats are **MP4, WebM and MOV** (iPhone recordings), up to **10 MB each**. They play inline with the browser's controls. Only the first frames load until someone presses play, and seeking uses HTTP Range requests.

Videos are stored in GridFS under their own `video` folder, so they can be capped separately from images and documents:

| Guard | Default | Env var | Error |
| ----- | ------- | ------- | ----- |
| Per video | 10 MB | — | `413` |
| Per user, rolling 24 h | 30 MB | `VIDEO_DAILY_LIMIT_MB` | `429 VideoQuotaExceeded` |
| Whole app | 150 MB | `VIDEO_STORAGE_LIMIT_MB` | `507 VideoStorageFull` |
| Retention | 30 days | `VIDEO_RETENTION_DAYS` | Video shows as "Video expired"; the message and its other attachments stay |

Voice notes have the same set of guards (100 MB total by default). Together the defaults keep voice and video under **250 MB**, about half of Atlas's free 512 MB, leaving the rest for images, documents and the data itself.

The browser plays whatever codec the file contains. MP4 (H.264) plays everywhere. Some `.mov` and `.webm` files from unusual sources may not play in Safari or Chrome respectively, but they can still be downloaded.
