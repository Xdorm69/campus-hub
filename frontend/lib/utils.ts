import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function getInitials(name: string | undefined | null, length = 2) {
  if (!name) return "?";
  return name.slice(0, length).toUpperCase();
}

// Discord-ish avatar / banner palette, picked deterministically per seed.
const SEED_COLORS = [
  "hsl(235 86% 65%)",
  "hsl(145 63% 42%)",
  "hsl(38 92% 50%)",
  "hsl(358 69% 56%)",
  "hsl(330 70% 58%)",
  "hsl(190 80% 42%)",
  "hsl(265 60% 60%)",
  "hsl(20 85% 55%)",
];

export function colorFromSeed(seed: string) {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash * 31 + seed.charCodeAt(i)) | 0;
  }
  return SEED_COLORS[Math.abs(hash) % SEED_COLORS.length];
}
