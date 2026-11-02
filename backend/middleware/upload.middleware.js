import multer from "multer";
import {
    ATTACHMENT_MIME_TYPES,
    AUDIO_MIME_TYPES,
    IMAGE_MIME_TYPES,
    UPLOAD_LIMITS,
} from "../constants/upload.js";
import { BadRequestError } from "../utils/ApiError.js";

/**
 * Files are held in memory only until the service writes them to GridFS
 * (see utils/files.js). Nothing touches local disk, so a failed request
 * leaves nothing behind to clean up.
 *
 * `mimeTypesByField` maps each form field to the types it accepts.
 */
function createUploader({ mimeTypesByField, maxFileSize, maxFiles }) {
    const fileFilter = (req, file, cb) => {
        // Recorders send e.g. "audio/webm;codecs=opus"; keep the base type.
        file.mimetype = file.mimetype.split(";")[0].trim().toLowerCase();

        const allowed = mimeTypesByField[file.fieldname];
        if (!allowed?.[file.mimetype]) {
            return cb(new BadRequestError(`Unsupported file type: ${file.originalname}`));
        }
        cb(null, true);
    };

    return multer({
        storage: multer.memoryStorage(),
        fileFilter,
        limits: { fileSize: maxFileSize, files: maxFiles },
    });
}

const messageUploader = createUploader({
    mimeTypesByField: { files: ATTACHMENT_MIME_TYPES, voice: AUDIO_MIME_TYPES },
    // Voice notes have a much smaller cap, enforced in messages.service.
    maxFileSize: UPLOAD_LIMITS.ATTACHMENT_MAX_SIZE,
    maxFiles: UPLOAD_LIMITS.ATTACHMENT_MAX_COUNT + 1,
});

const avatarUploader = createUploader({
    mimeTypesByField: { avatar: IMAGE_MIME_TYPES },
    maxFileSize: UPLOAD_LIMITS.AVATAR_MAX_SIZE,
    maxFiles: 1,
});

const bannerUploader = createUploader({
    mimeTypesByField: { banner: IMAGE_MIME_TYPES },
    maxFileSize: UPLOAD_LIMITS.BANNER_MAX_SIZE,
    maxFiles: 1,
});

/** `files` (attachments) and/or a single `voice` recording. */
export const uploadMessageFiles = messageUploader.fields([
    { name: "files", maxCount: UPLOAD_LIMITS.ATTACHMENT_MAX_COUNT },
    { name: "voice", maxCount: 1 },
]);
export const uploadAvatar = avatarUploader.single("avatar");
export const uploadBanner = bannerUploader.single("banner");
