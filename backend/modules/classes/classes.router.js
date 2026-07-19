import express from "express";
import { asyncHandler } from "../../utils/asyncHandler.js";
import authenticate from "../../middleware/authenticate.middleware.js";
import {classesController} from "./classes.controller.js";
import authorize from "../../middleware/authorize.middleware.js";
import { validate } from "../../middleware/validate.middleware.js";
import { createClassSchema, updateClassSchema, updateUserRoleSchema } from "./classes.validator.js";

const classesRouter = express.Router();

//USER
classesRouter.get("/", authenticate ,asyncHandler(classesController.getClasses));
classesRouter.get("/:id", authenticate ,asyncHandler(classesController.getClassById));
classesRouter.post("/:classId/join", authenticate, asyncHandler(classesController.joinClass));
classesRouter.get("/:classId/members", authenticate, asyncHandler(classesController.getClassMembers));
classesRouter.post("/:classId/leave", authenticate, asyncHandler(classesController.leaveClass));
//ADMIN
classesRouter.post("/", authenticate, authorize("ADMIN"), validate(createClassSchema),  asyncHandler(classesController.createClass));
classesRouter.patch("/:id", authenticate, authorize("ADMIN"), validate(updateClassSchema), asyncHandler(classesController.updateClass));
classesRouter.delete("/:id", authenticate, authorize("ADMIN"), asyncHandler(classesController.deleteClass));

// ban / unban - mute / unmute - up / down mod;
classesRouter.patch("/:classId/members/:memberId", authenticate, validate(updateUserRoleSchema), asyncHandler(classesController.updateUserStatus));
// force exit a room
classesRouter.delete("/:classId/members/:memberId", authenticate, authorize("ADMIN"), asyncHandler(classesController.forceExitRoom));

// get posts in a classroom [this is paginated];
classesRouter.get("/:classId/feed", authenticate, asyncHandler(classesController.getClassFeed));

export default classesRouter;