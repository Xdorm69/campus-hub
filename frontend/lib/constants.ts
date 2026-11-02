const MB = 1024 * 1024;

/** Polling cadence. Polls pause automatically while the tab is hidden. */
export const POLL_INTERVALS = {
  MESSAGES: 4_000,
  MY_CLASSES: 15_000,
  CLASS_DETAILS: 30_000,
  MEMBERS: 30_000,
} as const;

export const MESSAGES_PAGE_SIZE = 30;
export const MESSAGE_MAX_LENGTH = 4000;

/** Consecutive messages from one author within this window are grouped. */
export const MESSAGE_GROUP_WINDOW_MS = 7 * 60 * 1000;

export const ATTACHMENT_LIMITS = {
  MAX_FILES: 5,
  MAX_SIZE: 10 * MB,
  ACCEPT: [
    "image/png",
    "image/jpeg",
    "image/gif",
    "image/webp",
    "video/mp4",
    "video/webm",
    "video/quicktime",
    "application/pdf",
    "text/plain",
    "application/zip",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/vnd.ms-excel",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "application/vnd.ms-powerpoint",
    "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  ],
} as const;

/** Mirrors backend/constants/upload.js VOICE_LIMITS. */
export const VOICE_LIMITS = {
  MAX_DURATION_MS: 2 * 60 * 1000,
  MAX_SIZE: 1.5 * MB,
  /** Recordings shorter than this are treated as accidental taps. */
  MIN_DURATION_MS: 500,
  /** Opus at 32 kbps is clear speech at ~240 KB per minute. */
  BITRATE: 32_000,
  /** Preferred recorder formats, best first (Safari only supports mp4). */
  MIME_TYPES: ["audio/webm;codecs=opus", "audio/ogg;codecs=opus", "audio/webm", "audio/mp4"],
} as const;

/** GIF picker paging; KLIPY accepts 8–50 per page, GIPHY up to 50. */
export const GIF_PAGE_SIZE = 24;

export const AVATAR_LIMITS = {
  MAX_SIZE: 2 * MB,
  ACCEPT: ["image/png", "image/jpeg", "image/gif", "image/webp"],
} as const;

export const QUICK_REACTIONS = ["👍", "❤️", "😂"] as const;

export const REACTION_EMOJIS = [
  "👍", "👎", "❤️", "😂", "😮", "😢", "😡", "🎉",
  "🔥", "👏", "🙏", "💯", "✅", "❌", "👀", "🤔",
  "😅", "🥳", "😎", "🤯", "💡", "📌", "🚀", "⭐",
] as const;
