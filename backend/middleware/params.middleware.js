import mongoose from "mongoose";
import { BadRequestError } from "../utils/ApiError.js";

/** `router.param` handler that rejects malformed ObjectIds with a 400. */
export function objectIdParam(req, res, next, value, name) {
    if (!mongoose.isObjectIdOrHexString(value)) {
        return next(new BadRequestError(`Invalid ${name}`));
    }
    next();
}
