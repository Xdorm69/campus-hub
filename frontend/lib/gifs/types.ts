import { GifEmbed } from "@/types/message";

/** One search/trending result, normalized across providers. */
export interface GifResult {
  /** What gets stored on the message if the user picks this GIF. */
  embed: GifEmbed;
  /** Small, cheap rendition for the picker grid. */
  thumbnail: { url: string; isVideo: boolean; width: number; height: number };
}

export interface GifPage {
  results: GifResult[];
  /** Opaque cursor for the next page, or null at the end. */
  next: string | null;
}

export interface GifQuery {
  /** Empty → trending. */
  query: string;
  cursor: string | null;
  /** Stable per-user id; providers use it for personalization. */
  customerId?: string;
  signal?: AbortSignal;
}

/**
 * A GIF search backend. Both KLIPY and GIPHY require requests to come from
 * the end user's browser (not your server), so providers run client-side
 * with a public key — the same way their own SDKs work.
 */
export interface GifProvider {
  name: GifEmbed["provider"];
  /** Required/recommended attribution, shown in the picker. */
  searchPlaceholder: string;
  attribution: string;
  fetchGifs(query: GifQuery): Promise<GifPage>;
}
