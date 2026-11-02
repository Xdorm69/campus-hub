import { pipeline } from "node:stream/promises";
import { IMAGE_MIME_TYPES } from "../../constants/upload.js";
import { NotFoundError } from "../../utils/ApiError.js";
import { findUpload, openUploadStream } from "../../utils/files.js";

export const uploadsController = {
    getFile: async (req, res) => {
        const file = await findUpload(req.params.key);
        if (!file) throw new NotFoundError("File not found");

        const contentType = file.metadata?.contentType ?? "application/octet-stream";

        // Only images render inline; everything else downloads, so an
        // uploaded document can never execute in this origin.
        if (!IMAGE_MIME_TYPES[contentType]) res.attachment(file.filename);

        res.set({
            "Content-Type": contentType,
            "Content-Length": String(file.length),
            // Keys are unique ObjectIds and files never change.
            "Cache-Control": "public, max-age=31536000, immutable",
        });

        await pipeline(openUploadStream(file._id), res);
    },
};
