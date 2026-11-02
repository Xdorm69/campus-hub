import { GIF_PAGE_SIZE } from "@/lib/constants";
import { GifPage, GifProvider, GifQuery, GifResult } from "../types";

/**
 * KLIPY — https://docs.klipy.com/gifs-api
 * Free: test keys get 100 requests/hour; production access (unlimited) is a
 * free request from the Partner Panel once your integration is done.
 */
const BASE_URL = "https://api.klipy.com/api/v1";

interface KlipyRendition {
  url: string;
  width: number;
  height: number;
  size: number;
}

type KlipyFormats = Partial<Record<"gif" | "webp" | "jpg" | "mp4" | "webm", KlipyRendition>>;

interface KlipyItem {
  id: number;
  slug: string;
  title: string;
  type: string;
  file?: Partial<Record<"hd" | "md" | "sm" | "xs", KlipyFormats>>;
}

interface KlipyResponse {
  result: boolean;
  data: {
    data: KlipyItem[];
    current_page: number;
    per_page: number;
    has_next: boolean;
  };
}

function toResult(item: KlipyItem): GifResult | null {
  const md = item.file?.md ?? item.file?.hd;
  const sm = item.file?.sm ?? item.file?.xs ?? md;
  // MP4 is ~10x smaller than the GIF of the same clip.
  const full = md?.mp4 ?? md?.webp ?? md?.gif;
  const thumb = sm?.mp4 ?? sm?.webp ?? sm?.gif;
  if (!full || !thumb) return null;

  return {
    embed: {
      provider: "klipy",
      providerId: item.slug,
      title: item.title ?? "",
      url: full.url,
      previewUrl: sm?.jpg?.url ?? sm?.webp?.url ?? null,
      width: full.width,
      height: full.height,
    },
    thumbnail: { url: thumb.url, isVideo: thumb === sm?.mp4, width: thumb.width, height: thumb.height },
  };
}

export function createKlipyProvider(apiKey: string): GifProvider {
  return {
    name: "klipy",
    // KLIPY's attribution guidelines require this exact placeholder.
    searchPlaceholder: "Search KLIPY",
    attribution: "Powered by KLIPY",

    async fetchGifs({ query, cursor, customerId, signal }: GifQuery): Promise<GifPage> {
      const endpoint = query ? "search" : "trending";
      const params = new URLSearchParams({
        page: cursor ?? "1",
        per_page: String(GIF_PAGE_SIZE),
        content_filter: "medium",
        format_filter: "mp4,webp,jpg,gif",
      });
      if (query) params.set("q", query);
      if (customerId) params.set("customer_id", customerId);

      const response = await fetch(
        `${BASE_URL}/${encodeURIComponent(apiKey)}/gifs/${endpoint}?${params}`,
        { signal }
      );
      if (!response.ok) throw new Error(`KLIPY request failed (${response.status})`);

      const { data } = (await response.json()) as KlipyResponse;
      return {
        results: data.data.map(toResult).filter((r): r is GifResult => r !== null),
        next: data.has_next ? String(data.current_page + 1) : null,
      };
    },
  };
}
