import fs from "node:fs/promises";
import path from "node:path";
import { envConfig } from "../config/env.js";
import { logger } from "./logger.js";

/** Builds the public URL for a path stored relative to the upload dir. */
export function toPublicUrl(relativePath) {
    if (!relativePath) return null;
    return `${envConfig.PUBLIC_URL}/uploads/${relativePath.split(path.sep).join("/")}`;
}

/** Path relative to the upload dir for a file multer just wrote to disk. */
export function toRelativeUploadPath(absolutePath) {
    return path.relative(envConfig.UPLOAD_DIR, absolutePath).split(path.sep).join("/");
}

/** Best-effort delete; a missing file is not an error worth failing a request over. */
export async function removeUploads(relativePaths) {
    const paths = relativePaths.filter(Boolean);

    await Promise.all(
        paths.map(async (relativePath) => {
            const absolutePath = path.resolve(envConfig.UPLOAD_DIR, relativePath);

            // Never follow a stored path outside the upload directory.
            if (!absolutePath.startsWith(envConfig.UPLOAD_DIR + path.sep)) return;

            try {
                await fs.unlink(absolutePath);
            } catch (error) {
                if (error.code !== "ENOENT") {
                    logger.warn({ err: error, path: relativePath }, "Failed to remove upload");
                }
            }
        })
    );
}

/** Files multer attached to a request, regardless of single/array mode. */
export function getRequestFiles(req) {
    if (req.file) return [req.file];
    if (Array.isArray(req.files)) return req.files;
    if (req.files) return Object.values(req.files).flat();
    return [];
}
