import { envConfig } from "../../config/env.js";
import ApiResponse from "../../utils/ApiResponse.js";
import authService from "./auth.service.js";

export const authController = {
    register: async (req, res) => {
        const result = await authService.register(req.body);
        req.log.info("User registered");
        res.cookie("accessToken", result.token, {
            httpOnly: true,
            secure: envConfig.NODE_ENV === "production",
            sameSite: envConfig.NODE_ENV === "production" ? "none" : "lax",
            maxAge: 1000 * 60 * 60,
        });
        res.status(201).json(new ApiResponse(201, result, "User registered successfully"));
    },

    login: async (req, res) => {
        const result = await authService.login(req.body);
        req.log.info("User logged in");
        res.cookie("accessToken", result.token, {
            httpOnly: true,
            secure: envConfig.NODE_ENV === "production",
            sameSite: envConfig.NODE_ENV === "production" ? "none" : "lax",
            maxAge: 1000 * 60 * 60,
        });
        res.status(200).json(new ApiResponse(200, result, "User logged in successfully"));
    },
    
    logout: async (req, res) => {
    res.clearCookie("accessToken", {
        httpOnly: true,
        secure: envConfig.NODE_ENV === "production",
        sameSite: envConfig.NODE_ENV === "production" ? "none" : "lax",
    });

    return res
        .status(200)
        .json(new ApiResponse(200, null, "Logged out successfully"));
    }
}
