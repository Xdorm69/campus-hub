import express from "express";
import {asyncHandler} from "../../utils/asyncHandler.js";
import {authController} from "./auth.controller.js";
import {validate} from "../../middleware/validate.middleware.js";
import {registerSchema, loginSchema} from "./auth.validator.js";
import {authLimiter} from "../../utils/rateLimiter.js";

const authRouter = express.Router();

authRouter.post("/register", authLimiter, validate(registerSchema), asyncHandler(authController.register));
authRouter.post("/login", authLimiter, validate(loginSchema), asyncHandler(authController.login));
authRouter.post("/logout", asyncHandler(authController.logout));

export default authRouter;