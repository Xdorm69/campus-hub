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
