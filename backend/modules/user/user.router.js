import express from "express";
import authenticate from "../../middleware/authenticate.middleware.js";
import { validate } from "../../middleware/validate.middleware.js";
import { uploadAvatar, uploadBanner } from "../../middleware/upload.middleware.js";
import { objectIdParam } from "../../middleware/params.middleware.js";
import { userProfileUpdateSchema } from "./user.validator.js";
import { userController } from "./user.controller.js";

const userRouter = express.Router();

userRouter.use(authenticate);
userRouter.param("id", objectIdParam);

userRouter.get("/me", userController.getProfile);
userRouter.patch("/me", validate(userProfileUpdateSchema), userController.updateProfile);
userRouter.put("/me/avatar", uploadAvatar, userController.updateAvatar);
userRouter.delete("/me/avatar", userController.removeAvatar);
userRouter.put("/me/banner", uploadBanner, userController.updateBanner);
userRouter.delete("/me/banner", userController.removeBanner);
userRouter.get("/me/classes", userController.getUserClasses);
userRouter.get("/:id", userController.getProfileById);

export default userRouter;
