const MB = 1024 * 1024;

export const UPLOAD_FOLDERS = {
    ATTACHMENTS: "attachments",
    AVATARS: "avatars",
};

// Extension is derived from the MIME type (never from the client file name),
// so a renamed .html can't slip through as an image.
export const IMAGE_MIME_TYPES = {
    "image/png": ".png",
    "image/jpeg": ".jpg",
    "image/gif": ".gif",
    "image/webp": ".webp",
};

export const ATTACHMENT_MIME_TYPES = {
    ...IMAGE_MIME_TYPES,
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

export const UPLOAD_LIMITS = {
    ATTACHMENT_MAX_SIZE: 10 * MB,
    ATTACHMENT_MAX_COUNT: 5,
    AVATAR_MAX_SIZE: 2 * MB,
};
