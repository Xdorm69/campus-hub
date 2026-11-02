import { colorFromSeed } from "./utils";

/**
 * Built-in profile banners, served from /public/banners. The API stores
 * only the id, so these cost no database storage.
 * Keep the ids in sync with backend/constants/banners.js.
 */
export const BANNER_PRESETS = [
  { id: "aurora", label: "Aurora" },
  { id: "sunset", label: "Sunset" },
  { id: "ocean", label: "Ocean" },
  { id: "forest", label: "Forest" },
  { id: "nebula", label: "Nebula" },
  { id: "blueprint", label: "Blueprint" },
  { id: "candy", label: "Candy" },
  { id: "midnight", label: "Midnight" },
] as const;

export type BannerPresetId = (typeof BANNER_PRESETS)[number]["id"];

export const bannerPresetUrl = (id: BannerPresetId) => `/banners/${id}.svg`;

export type ResolvedBanner = { kind: "image"; url: string } | { kind: "color"; color: string };

/** Uploaded banner → preset → stable color derived from the user id. */
export function resolveBanner(user: {
  id: string;
  bannerUrl?: string | null;
  bannerPreset?: BannerPresetId | null;
}): ResolvedBanner {
  if (user.bannerUrl) return { kind: "image", url: user.bannerUrl };
  if (user.bannerPreset) return { kind: "image", url: bannerPresetUrl(user.bannerPreset) };
  return { kind: "color", color: colorFromSeed(user.id) };
}
