import jwt from "jsonwebtoken";
import { envConfig } from "../config/env.js";
import { UnauthorizedError } from "../utils/ApiError.js";
import {asyncHandler} from "../utils/asyncHandler.js";

const authenticate = asyncHandler(async (req, res, next) => {
    const token = req.cookies.accessToken;

    if (!token) {
    throw new UnauthorizedError("Access token is required");
    }

    try {
        const decoded = jwt.verify(token, envConfig.JWT_SECRET);

        req.user = {
            id: decoded.sub,
            role: decoded.role,
        };

        next();
    } catch (error) {
        throw new UnauthorizedError("Invalid or expired access token");
    }
});

export default authenticate;