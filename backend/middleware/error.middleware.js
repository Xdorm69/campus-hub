import mongoose from "mongoose";
import multer from "multer";
import ApiError from "../utils/ApiError.js";
import { isProduction } from "../config/env.js";
import { getRequestFiles, removeUploads, toRelativeUploadPath } from "../utils/files.js";

const MULTER_MESSAGES = {
    LIMIT_FILE_SIZE: "File is too large",
    LIMIT_FILE_COUNT: "Too many files",
    LIMIT_UNEXPECTED_FILE: "Unexpected file field",
};

/** Maps library errors onto the ApiError shape the client understands. */
function normalizeError(err) {
    if (err instanceof ApiError) return err;

    if (err instanceof multer.MulterError) {
        const status = err.code === "LIMIT_FILE_SIZE" ? 413 : 400;
        return new ApiError(status, "UploadError", MULTER_MESSAGES[err.code] ?? err.message);
    }

    if (err instanceof mongoose.Error.CastError) {
        return new ApiError(400, "InvalidIdError", `Invalid ${err.path}`);
    }

    if (err instanceof mongoose.Error.ValidationError) {
        const message = Object.values(err.errors).map((e) => e.message).join(", ");
        return new ApiError(400, "ValidationError", message);
    }

    // Duplicate key from a unique index.
    if (err?.code === 11000) {
        const field = Object.keys(err.keyPattern ?? err.keyValue ?? {})[0] ?? "Value";
        return new ApiError(409, "ConflictError", `${field} already exists`);
    }

    // Malformed JSON body from express.json().
    if (err?.type === "entity.parse.failed") {
        return new ApiError(400, "BadRequestError", "Malformed JSON body");
    }

    return new ApiError(500, "ServerError", isProduction ? "Internal Server Error" : err.message);
}

export const errorHandler = async (err, req, res, next) => {
    const error = normalizeError(err);

    // Files are written before validation runs; don't leave orphans behind
    // when the request fails.
    const uploaded = getRequestFiles(req);
    if (uploaded.length > 0) {
        await removeUploads(uploaded.map((file) => toRelativeUploadPath(file.path)));
    }

    const log = error.statusCode >= 500 ? req.log.error : req.log.warn;
    log.call(req.log, {
        err,
        method: req.method,
        url: req.originalUrl,
        userId: req.user?.id,
        statusCode: error.statusCode,
    });

    res.status(error.statusCode).json({
        success: false,
        type: error.type,
        message: error.message,
        ...(error.errors && { errors: error.errors }),
    });
};

export const notFoundHandler = (req, res) => {
    res.status(404).json({
        success: false,
        type: "NotFoundError",
        message: `Route ${req.method} ${req.originalUrl} not found`,
    });
};
