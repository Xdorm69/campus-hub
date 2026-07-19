import express from "express";
import { asyncHandler } from "../../utils/asyncHandler.js";
import authenticate from "../../middleware/authenticate.middleware.js";
import { validate } from "../../middleware/validate.middleware.js";
import { userProfileUpdateSchema } from "./user.validator.js";
import authorize from "../../middleware/authorize.middleware.js";
import { userController } from "./user.controller.js";

const userRouter = express.Router();

userRouter.get("/me", authenticate , asyncHandler(userController.getProfile))
userRouter.patch("/me", authenticate, validate(userProfileUpdateSchema), asyncHandler(userController.updateProfile))
userRouter.get("/me/classes", authenticate, asyncHandler(userController.getUserClasses))
userRouter.get("/me/posts", authenticate, asyncHandler(userController.getUserPosts));
userRouter.get("/:id", authenticate, authorize("ADMIN"), asyncHandler(userController.getProfileById))

export default userRouter;