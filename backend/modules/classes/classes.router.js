import express from "express";
import authenticate from "../../middleware/authenticate.middleware.js";
import authorize from "../../middleware/authorize.middleware.js";
import { validate } from "../../middleware/validate.middleware.js";
import { objectIdParam } from "../../middleware/params.middleware.js";
import { ROLES } from "../../constants/roles.js";
import messagesRouter from "../messages/messages.router.js";
import { classesController } from "./classes.controller.js";
import {
    createClassSchema,
    listClassesQuerySchema,
    updateClassSchema,
    updateMemberStatusSchema,
} from "./classes.validator.js";

const classesRouter = express.Router();

classesRouter.use(authenticate);
classesRouter.param("classId", objectIdParam);
classesRouter.param("memberId", objectIdParam);

// Browsing & membership
classesRouter.get("/", validate(listClassesQuerySchema, "query"), classesController.getClasses);
classesRouter.get("/:classId", classesController.getClassById);
classesRouter.post("/:classId/join", classesController.joinClass);
classesRouter.post("/:classId/leave", classesController.leaveClass);
classesRouter.post("/:classId/read", classesController.markRead);

// Members & moderation (mute / ban / promote / kick). Moderators and admins;
// fine-grained rules live in membership.service.
classesRouter.get("/:classId/members", classesController.getClassMembers);
classesRouter.patch(
    "/:classId/members/:memberId",
    validate(updateMemberStatusSchema),
    classesController.updateMemberStatus
);
classesRouter.delete("/:classId/members/:memberId", classesController.removeMember);

// Chat messages
classesRouter.use("/:classId/messages", messagesRouter);

// Admin only
classesRouter.post("/", authorize(ROLES.ADMIN), validate(createClassSchema), classesController.createClass);
classesRouter.patch(
    "/:classId",
    authorize(ROLES.ADMIN),
    validate(updateClassSchema),
    classesController.updateClass
);
classesRouter.delete("/:classId", authorize(ROLES.ADMIN), classesController.deleteClass);

export default classesRouter;
