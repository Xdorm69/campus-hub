import { pipeline } from "node:stream/promises";
import { INLINE_MIME_TYPES } from "../../constants/upload.js";
import ApiError, { NotFoundError } from "../../utils/ApiError.js";
import { findUpload, openUploadStream } from "../../utils/files.js";

export const uploadsController = {
    getFile: async (req, res) => {
        const file = await findUpload(req.params.key);
        if (!file) throw new NotFoundError("File not found");

        const contentType = file.metadata?.contentType ?? "application/octet-stream";

        // Images and audio render inline; everything else downloads, so an
        // uploaded document can never execute in this origin.
        if (!INLINE_MIME_TYPES[contentType]) res.attachment(file.filename);

        res.set({
            "Content-Type": contentType,
            "Accept-Ranges": "bytes",
            // Keys are unique ObjectIds and files never change.
            "Cache-Control": "public, max-age=31536000, immutable",
        });

        // Byte ranges: required by Safari for audio, and what makes seeking
        // work in every browser's <audio> element.
        const ranges = req.headers.range ? req.range(file.length, { combine: true }) : null;

        if (ranges === -1) {
            res.set("Content-Range", `bytes */${file.length}`);
            throw new ApiError(416, "RangeNotSatisfiable", "Requested range not satisfiable");
        }

        if (Array.isArray(ranges) && ranges.type === "bytes" && ranges.length === 1) {
            const { start, end } = ranges[0];
            res.status(206).set({
                "Content-Range": `bytes ${start}-${end}/${file.length}`,
                "Content-Length": String(end - start + 1),
            });
            return pipeline(openUploadStream(file._id, { start, end }), res);
        }

        res.set("Content-Length", String(file.length));
        await pipeline(openUploadStream(file._id), res);
    },
};
