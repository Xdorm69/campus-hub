import { toPublicUrl } from "../../utils/files.js";
import { toAuthorDTO } from "../user/user.mapper.js";

const REPLY_PREVIEW_LENGTH = 200;

function toAttachmentDTO(attachment) {
    return {
        id: String(attachment._id),
        url: toPublicUrl(attachment.path),
        name: attachment.originalName,
        mimeType: attachment.mimeType,
        size: attachment.size,
    };
}

function toReplyPreviewDTO(reply) {
    // Populate yields null if the referenced message was hard-deleted.
    if (!reply || typeof reply !== "object") return null;

    const isDeleted = Boolean(reply.deletedAt);

    return {
        id: String(reply._id),
        author: toAuthorDTO(reply.author),
        content: isDeleted ? "" : reply.content.slice(0, REPLY_PREVIEW_LENGTH),
        hasAttachments: !isDeleted && reply.attachments?.length > 0,
        isDeleted,
    };
}

export function toMessageDTO(message) {
    return {
        id: String(message._id),
        classId: String(message.class),
        author: toAuthorDTO(message.author),
        content: message.content,
        attachments: (message.attachments ?? []).map(toAttachmentDTO),
        replyTo: toReplyPreviewDTO(message.replyTo),
        reactions: (message.reactions ?? []).map((reaction) => ({
            emoji: reaction.emoji,
            count: reaction.users.length,
            userIds: reaction.users.map(String),
        })),
        editedAt: message.editedAt ?? null,
        deletedAt: message.deletedAt ?? null,
        createdAt: message.createdAt,
        updatedAt: message.updatedAt,
    };
}
