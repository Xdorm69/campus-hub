import jwt from "jsonwebtoken";
import { envConfig } from "../config/env.js";
import { UnauthorizedError } from "../utils/ApiError.js";
import { User } from "../models/index.js";

export const AUTH_COOKIE_NAME = "accessToken";

const authenticate = async (req, res, next) => {
    const token = req.cookies?.[AUTH_COOKIE_NAME];

    if (!token) {
        throw new UnauthorizedError("Access token is required");
    }

    let decoded;
    try {
        decoded = jwt.verify(token, envConfig.JWT_SECRET);
    } catch {
        throw new UnauthorizedError("Invalid or expired access token");
    }

    // Look the user up so a deleted account or a changed role takes effect
    // immediately instead of when the token expires.
    const user = await User.findById(decoded.sub).select("role").lean();
    if (!user) {
        throw new UnauthorizedError("Account no longer exists");
    }

    req.user = {
        id: String(user._id),
        role: user.role,
    };

    next();
};

export default authenticate;
