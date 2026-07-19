import express from "express";
import {asyncHandler} from "../../utils/asyncHandler.js";
import {authController} from "./auth.controller.js";
import {validate} from "../../middleware/validate.middleware.js";
import {registerSchema, loginSchema} from "./auth.validator.js";

const authRouter = express.Router();

authRouter.post("/register", validate(registerSchema), asyncHandler(authController.register));
authRouter.post("/login", validate(loginSchema), asyncHandler(authController.login));
authRouter.post("/logout", asyncHandler(authController.logout));

export default authRouter;