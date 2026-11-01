import fs from "node:fs";
import path from "node:path";
import { randomUUID } from "node:crypto";
import multer from "multer";
import { envConfig } from "../config/env.js";
import {
    ATTACHMENT_MIME_TYPES,
    IMAGE_MIME_TYPES,
    UPLOAD_FOLDERS,
    UPLOAD_LIMITS,
} from "../constants/upload.js";
import { BadRequestError } from "../utils/ApiError.js";

function createUploader({ folder, mimeTypes, maxFileSize, maxFiles }) {
    const destination = path.join(envConfig.UPLOAD_DIR, folder);
    fs.mkdirSync(destination, { recursive: true });

    const storage = multer.diskStorage({
        destination,
        filename: (req, file, cb) => cb(null, `${randomUUID()}${mimeTypes[file.mimetype]}`),
    });

    const fileFilter = (req, file, cb) => {
        if (!mimeTypes[file.mimetype]) {
            return cb(new BadRequestError(`Unsupported file type: ${file.originalname}`));
        }
        cb(null, true);
    };

    return multer({
        storage,
        fileFilter,
        limits: { fileSize: maxFileSize, files: maxFiles },
    });
}

const attachmentUploader = createUploader({
    folder: UPLOAD_FOLDERS.ATTACHMENTS,
    mimeTypes: ATTACHMENT_MIME_TYPES,
    maxFileSize: UPLOAD_LIMITS.ATTACHMENT_MAX_SIZE,
    maxFiles: UPLOAD_LIMITS.ATTACHMENT_MAX_COUNT,
});

const avatarUploader = createUploader({
    folder: UPLOAD_FOLDERS.AVATARS,
    mimeTypes: IMAGE_MIME_TYPES,
    maxFileSize: UPLOAD_LIMITS.AVATAR_MAX_SIZE,
    maxFiles: 1,
});

export const uploadAttachments = attachmentUploader.array("files", UPLOAD_LIMITS.ATTACHMENT_MAX_COUNT);
export const uploadAvatar = avatarUploader.single("avatar");
