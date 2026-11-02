const MB = 1024 * 1024;

// Extension is derived from the MIME type (never from the client file name),
// so a renamed .html can't slip through as an image.
export const IMAGE_MIME_TYPES = {
    "image/png": ".png",
    "image/jpeg": ".jpg",
    "image/gif": ".gif",
    "image/webp": ".webp",
};

// Short clips from phones and screen recorders. iPhones record .mov
// (QuickTime), which browsers play when it's H.264.
export const VIDEO_MIME_TYPES = {
    "video/mp4": ".mp4",
    "video/webm": ".webm",
    "video/quicktime": ".mov",
};

export const ATTACHMENT_MIME_TYPES = {
    ...IMAGE_MIME_TYPES,
    ...VIDEO_MIME_TYPES,
    "application/pdf": ".pdf",
    "text/plain": ".txt",
    "application/zip": ".zip",
    "application/msword": ".doc",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document": ".docx",
    "application/vnd.ms-excel": ".xls",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": ".xlsx",
    "application/vnd.ms-powerpoint": ".ppt",
    "application/vnd.openxmlformats-officedocument.presentationml.presentation": ".pptx",
};

// What browsers' MediaRecorder produces: Chrome/Firefox record Opus in WebM
// or Ogg, Safari records AAC in MP4.
export const AUDIO_MIME_TYPES = {
    "audio/webm": ".webm",
    "audio/ogg": ".ogg",
    "audio/mp4": ".m4a",
    "audio/x-m4a": ".m4a",
    "audio/aac": ".aac",
    "audio/mpeg": ".mp3",
};

/** Every type we store, for looking up a file extension. */
export const ALL_MIME_TYPES = { ...ATTACHMENT_MIME_TYPES, ...AUDIO_MIME_TYPES };

/** Types the browser may render/play inline instead of downloading. */
export const INLINE_MIME_TYPES = { ...IMAGE_MIME_TYPES, ...VIDEO_MIME_TYPES, ...AUDIO_MIME_TYPES };

export const isVideoType = (mimeType) => Boolean(VIDEO_MIME_TYPES[mimeType]);

export const UPLOAD_LIMITS = {
    ATTACHMENT_MAX_SIZE: 10 * MB,
    ATTACHMENT_MAX_COUNT: 5,
    AVATAR_MAX_SIZE: 2 * MB,
};

/**
 * Hard per-item caps (the frontend mirrors these). Storage-wide limits
 * (per-user daily quota, total cap, retention) are configurable in env.js.
 */
export const VOICE_LIMITS = {
    MAX_DURATION_MS: 2 * 60 * 1000,
    // ~2 min of 32 kbps Opus is ~0.5 MB; leaves headroom for Safari's AAC.
    MAX_SIZE: 1.5 * MB,
};

export const VIDEO_LIMITS = {
    // "Small videos", like Discord's free tier.
    MAX_SIZE: 10 * MB,
};

export const UPLOAD_FOLDERS = {
    ATTACHMENTS: "attachments",
    AVATARS: "avatars",
    VOICE: "voice",
    VIDEO: "video",
};

/** GridFS folder a message attachment is stored under (for quota accounting). */
export const folderForAttachment = (mimeType) =>
    isVideoType(mimeType) ? UPLOAD_FOLDERS.VIDEO : UPLOAD_FOLDERS.ATTACHMENTS;
