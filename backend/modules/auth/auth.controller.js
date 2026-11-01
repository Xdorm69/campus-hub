import { envConfig, isProduction } from "../../config/env.js";
import { AUTH_COOKIE_NAME } from "../../middleware/authenticate.middleware.js";
import ApiResponse from "../../utils/ApiResponse.js";
import authService from "./auth.service.js";

const cookieOptions = {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? "none" : "lax",
};

function setAuthCookie(res, token) {
    res.cookie(AUTH_COOKIE_NAME, token, {
        ...cookieOptions,
        maxAge: envConfig.JWT_EXPIRES_IN_HOURS * 60 * 60 * 1000,
    });
}

export const authController = {
    register: async (req, res) => {
        const { user, token } = await authService.register(req.body);
        req.log.info({ userId: user.id }, "User registered");

        setAuthCookie(res, token);
        ApiResponse.send(res, 201, { user }, "User registered successfully");
    },

    login: async (req, res) => {
        const { user, token } = await authService.login(req.body);
        req.log.info({ userId: user.id }, "User logged in");

        setAuthCookie(res, token);
        ApiResponse.send(res, 200, { user }, "User logged in successfully");
    },

    logout: async (req, res) => {
        res.clearCookie(AUTH_COOKIE_NAME, cookieOptions);
        ApiResponse.send(res, 200, null, "Logged out successfully");
    },
};
