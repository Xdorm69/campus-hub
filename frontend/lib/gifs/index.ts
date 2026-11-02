import { createGiphyProvider } from "./providers/giphy";
import { createKlipyProvider } from "./providers/klipy";
import { GifProvider } from "./types";

export type { GifPage, GifProvider, GifResult } from "./types";

/**
 * The configured GIF provider, or null when no key is set (the GIF button
 * is hidden). Configure in frontend/.env:
 *
 *   NEXT_PUBLIC_GIF_PROVIDER=klipy        # or "giphy"
 *   NEXT_PUBLIC_GIF_API_KEY=your-key
 *
 * Keys are public by design: both providers require search requests to be
 * made from the user's browser.
 */
function createGifProvider(): GifProvider | null {
  // Literal property access so Next.js can inline these at build time.
  const apiKey = process.env.NEXT_PUBLIC_GIF_API_KEY?.trim();
  const provider = (process.env.NEXT_PUBLIC_GIF_PROVIDER ?? "klipy").trim().toLowerCase();

  if (!apiKey) return null;

  switch (provider) {
    case "klipy":
      return createKlipyProvider(apiKey);
    case "giphy":
      return createGiphyProvider(apiKey);
    default:
      console.warn(`Unknown NEXT_PUBLIC_GIF_PROVIDER "${provider}"; GIFs are disabled.`);
      return null;
  }
}

export const gifProvider = createGifProvider();
