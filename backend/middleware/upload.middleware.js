import multer from "multer";
import { ATTACHMENT_MIME_TYPES, IMAGE_MIME_TYPES, UPLOAD_LIMITS } from "../constants/upload.js";
import { BadRequestError } from "../utils/ApiError.js";

/**
 * Files are held in memory only until the service writes them to GridFS
 * (see utils/files.js). Nothing touches local disk, so a failed request
 * leaves nothing behind to clean up.
 */
function createUploader({ mimeTypes, maxFileSize, maxFiles }) {
    const fileFilter = (req, file, cb) => {
        if (!mimeTypes[file.mimetype]) {
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

const attachmentUploader = createUploader({
    mimeTypes: ATTACHMENT_MIME_TYPES,
    maxFileSize: UPLOAD_LIMITS.ATTACHMENT_MAX_SIZE,
    maxFiles: UPLOAD_LIMITS.ATTACHMENT_MAX_COUNT,
});

const avatarUploader = createUploader({
    mimeTypes: IMAGE_MIME_TYPES,
    maxFileSize: UPLOAD_LIMITS.AVATAR_MAX_SIZE,
    maxFiles: 1,
});

export const uploadAttachments = attachmentUploader.array("files", UPLOAD_LIMITS.ATTACHMENT_MAX_COUNT);
export const uploadAvatar = avatarUploader.single("avatar");
