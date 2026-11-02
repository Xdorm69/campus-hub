import { Readable } from "node:stream";
import { pipeline } from "node:stream/promises";
import mongoose from "mongoose";
import { envConfig } from "../config/env.js";
import { ATTACHMENT_MIME_TYPES } from "../constants/upload.js";
import { logger } from "./logger.js";

/**
 * Uploads live in MongoDB GridFS (bucket "uploads"), not on local disk, so
 * they survive redeploys and restarts on hosts with ephemeral filesystems
 * (Render, Railway, Heroku...).
 *
 * A stored file is referenced by its "key": `<gridfs ObjectId><ext>`,
 * e.g. "6af3c1...e9.png". The extension only makes URLs readable.
 */
const BUCKET_NAME = "uploads";

let bucket = null;

function getBucket() {
    if (!bucket) {
        bucket = new mongoose.mongo.GridFSBucket(mongoose.connection.db, { bucketName: BUCKET_NAME });
    }
    return bucket;
}

/** GridFS id for a key, or null for malformed/legacy (disk-era) keys. */
function parseKey(key) {
    const id = typeof key === "string" ? key.split(".")[0] : "";
    return mongoose.isObjectIdOrHexString(id) ? new mongoose.Types.ObjectId(id) : null;
}

/** Builds the public URL for a stored file key. */
export function toPublicUrl(key) {
    if (!key) return null;
    return `${envConfig.PUBLIC_URL}/uploads/${key}`;
}

/** Writes one multer (memory storage) file to GridFS and returns its key. */
export async function saveUpload(file, folder) {
    const id = new mongoose.Types.ObjectId();
    const extension = ATTACHMENT_MIME_TYPES[file.mimetype] ?? "";

    const stream = getBucket().openUploadStreamWithId(id, file.originalname, {
        metadata: { contentType: file.mimetype, folder },
    });
    await pipeline(Readable.from(file.buffer), stream);

    return `${id}${extension}`;
}

/** Saves several files; if any fails, the ones already written are removed. */
export async function saveUploads(files, folder) {
    const results = await Promise.allSettled(files.map((file) => saveUpload(file, folder)));
    const keys = results.filter((r) => r.status === "fulfilled").map((r) => r.value);

    const failure = results.find((r) => r.status === "rejected");
    if (failure) {
        await removeUploads(keys);
        throw failure.reason;
    }

    return keys;
}

/** Best-effort delete; a missing file is not an error worth failing a request over. */
export async function removeUploads(keys) {
    await Promise.all(
        keys.map(parseKey).filter(Boolean).map(async (id) => {
            try {
                await getBucket().delete(id);
            } catch (error) {
                if (!/FileNotFound|file not found/i.test(error.message)) {
                    logger.warn({ err: error, id: String(id) }, "Failed to remove upload");
                }
            }
        })
    );
}

/** File document (name, length, metadata) for a key, or null. */
export async function findUpload(key) {
    const id = parseKey(key);
    if (!id) return null;
    return getBucket().find({ _id: id }).next();
}

export function openUploadStream(fileId) {
    return getBucket().openDownloadStream(fileId);
}
