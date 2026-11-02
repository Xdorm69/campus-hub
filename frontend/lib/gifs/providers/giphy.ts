import { GIF_PAGE_SIZE } from "@/lib/constants";
import { GifPage, GifProvider, GifQuery, GifResult } from "../types";

/**
 * GIPHY — https://developers.giphy.com/docs/api/endpoint
 * The free beta key is rate-limited and meant for development; production
 * use needs GIPHY's approval. Requires "Powered by GIPHY" attribution.
 */
const BASE_URL = "https://api.giphy.com/v1/gifs";
// GIPHY caps offset at 499.
const MAX_OFFSET = 499;

interface GiphyRendition {
  url?: string;
  mp4?: string;
  webp?: string;
  width: string;
  height: string;
}

interface GiphyItem {
  id: string;
  title: string;
  images: Partial<Record<"original" | "fixed_width" | "fixed_width_still", GiphyRendition>>;
}

interface GiphyResponse {
  data: GiphyItem[];
  pagination: { total_count: number; count: number; offset: number };
}

function toResult(item: GiphyItem): GifResult | null {
  const original = item.images.original;
  const small = item.images.fixed_width;
  const fullUrl = original?.mp4 ?? original?.url;
  const thumbUrl = small?.mp4 ?? small?.webp ?? small?.url;
  if (!original || !small || !fullUrl || !thumbUrl) return null;

  return {
    embed: {
      provider: "giphy",
      providerId: item.id,
      title: item.title ?? "",
      url: fullUrl,
      previewUrl: item.images.fixed_width_still?.url ?? null,
      width: Number(original.width),
      height: Number(original.height),
    },
    thumbnail: {
      url: thumbUrl,
      isVideo: thumbUrl === small.mp4,
      width: Number(small.width),
      height: Number(small.height),
    },
  };
}

export function createGiphyProvider(apiKey: string): GifProvider {
  return {
    name: "giphy",
    searchPlaceholder: "Search GIPHY",
    attribution: "Powered by GIPHY",

    async fetchGifs({ query, cursor, customerId, signal }: GifQuery): Promise<GifPage> {
      const endpoint = query ? "search" : "trending";
      const params = new URLSearchParams({
        api_key: apiKey,
        limit: String(GIF_PAGE_SIZE),
        offset: cursor ?? "0",
        rating: "pg-13",
      });
      if (query) params.set("q", query);
      if (customerId) params.set("customer_id", customerId);

      const response = await fetch(`${BASE_URL}/${endpoint}?${params}`, { signal });
      if (!response.ok) throw new Error(`GIPHY request failed (${response.status})`);

      const { data, pagination } = (await response.json()) as GiphyResponse;
      const nextOffset = pagination.offset + pagination.count;
      const hasMore = pagination.count > 0 && nextOffset < pagination.total_count && nextOffset <= MAX_OFFSET;

      return {
        results: data.map(toResult).filter((r): r is GifResult => r !== null),
        next: hasMore ? String(nextOffset) : null,
      };
    },
  };
}
