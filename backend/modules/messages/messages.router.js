import express from "express";
import authenticate from "../../middleware/authenticate.middleware.js";
import { validate } from "../../middleware/validate.middleware.js";
import { uploadMessageFiles } from "../../middleware/upload.middleware.js";
import { objectIdParam } from "../../middleware/params.middleware.js";
import { messagesController } from "./messages.controller.js";
import {
    editMessageSchema,
    listMessagesQuerySchema,
    reactionSchema,
    sendMessageSchema,
    syncMessagesQuerySchema,
} from "./messages.validator.js";

/**
 * Class-scoped routes, mounted at /classes/:classId/messages (the parent
 * router authenticates and validates :classId).
 */
const messagesRouter = express.Router({ mergeParams: true });

messagesRouter.get("/", validate(listMessagesQuerySchema, "query"), messagesController.listMessages);
messagesRouter.get("/sync", validate(syncMessagesQuerySchema, "query"), messagesController.syncMessages);
messagesRouter.post("/", uploadMessageFiles, validate(sendMessageSchema), messagesController.sendMessage);

/** Message-scoped routes, mounted at /messages. */
export const messageItemRouter = express.Router();

messageItemRouter.use(authenticate);
messageItemRouter.param("messageId", objectIdParam);

messageItemRouter.patch("/:messageId", validate(editMessageSchema), messagesController.editMessage);
messageItemRouter.delete("/:messageId", messagesController.deleteMessage);
messageItemRouter.put("/:messageId/reactions", validate(reactionSchema), messagesController.toggleReaction);

export default messagesRouter;
