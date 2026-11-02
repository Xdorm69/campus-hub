import ApiResponse from "../../utils/ApiResponse.js";
import { messagesService } from "./messages.service.js";

export const messagesController = {
    listMessages: async (req, res) => {
        const page = await messagesService.listMessages(req.user, req.params.classId, req.validated.query);
        ApiResponse.send(res, 200, page, "Messages fetched successfully");
    },

    syncMessages: async (req, res) => {
        const delta = await messagesService.syncMessages(req.user, req.params.classId, req.validated.query);
        ApiResponse.send(res, 200, delta, "Messages synced successfully");
    },

    sendMessage: async (req, res) => {
        const message = await messagesService.sendMessage(req.user, req.params.classId, req.body, {
            files: req.files?.files ?? [],
            voice: req.files?.voice?.[0] ?? null,
        });
        ApiResponse.send(res, 201, message, "Message sent successfully");
    },

    editMessage: async (req, res) => {
        const message = await messagesService.editMessage(req.user, req.params.messageId, req.body);
        ApiResponse.send(res, 200, message, "Message updated successfully");
    },

    deleteMessage: async (req, res) => {
        const message = await messagesService.deleteMessage(req.user, req.params.messageId);
        ApiResponse.send(res, 200, message, "Message deleted successfully");
    },

    toggleReaction: async (req, res) => {
        const message = await messagesService.toggleReaction(req.user, req.params.messageId, req.body);
        ApiResponse.send(res, 200, message, "Reaction updated successfully");
    },
};
