import { ROLES } from "../../constants/roles.js";
import { BadRequestError, ForbiddenError, NotFoundError } from "../../utils/ApiError.js";
import { UPLOAD_FOLDERS } from "../../constants/upload.js";
import { removeUploads, saveUploads } from "../../utils/files.js";
import { classesRepository } from "../classes/classes.repository.js";
import { membershipRepository } from "../membership/membership.repository.js";
import { membershipService } from "../membership/membership.service.js";
import { messagesRepository } from "./messages.repository.js";
import { toMessageDTO } from "./messages.mapper.js";
import { assertVoiceNoteAllowed } from "./voice-quota.js";

// A write stamps `updatedAt` slightly before it becomes visible to queries.
// Re-scanning a few seconds back means a poll can't slip between the two;
// clients de-duplicate by id, so the overlap is harmless.
const SYNC_OVERLAP_MS = 5_000;
const SYNC_BATCH_LIMIT = 100;
const MAX_DISTINCT_REACTIONS = 20;

async function findLiveMessage(messageId) {
    const message = await messagesRepository.findById(messageId);
    if (!message || message.deletedAt) throw new NotFoundError("Message not found");
    return message;
}

function toAttachment(file, key) {
    return {
        path: key,
        originalName: file.originalname.slice(0, 255),
        mimeType: file.mimetype,
        size: file.size,
    };
}

export const messagesService = {
    /** Older history for infinite scroll. Returned oldest -> newest. */
    listMessages: async (user, classId, { before, limit }) => {
        await membershipService.assertCanRead(user, classId);

        // Taken before the query, so anything written during it is caught by
        // the first sync instead of falling between the two.
        const serverTime = new Date();
        const docs = await messagesRepository.findPage(classId, { before, limit });

        const hasMore = docs.length > limit;
        const page = docs.slice(0, limit);

        return {
            messages: page.reverse().map(toMessageDTO),
            nextCursor: hasMore ? String(page[0]._id) : null,
            serverTime,
        };
    },

    /** Delta for polling: new, edited, reacted-to and deleted messages. */
    syncMessages: async (user, classId, { since }) => {
        await membershipService.assertCanRead(user, classId);

        const serverTime = new Date();
        const from = new Date(since.getTime() - SYNC_OVERLAP_MS);
        const docs = await messagesRepository.findChangedSince(classId, from, SYNC_BATCH_LIMIT);

        return {
            messages: docs.slice(0, SYNC_BATCH_LIMIT).map(toMessageDTO),
            // Too much changed to patch incrementally; the client should refetch.
            hasMore: docs.length > SYNC_BATCH_LIMIT,
            serverTime,
        };
    },

    sendMessage: async (user, classId, { content, replyTo, voiceDurationMs }, { files = [], voice = null } = {}) => {
        await membershipService.assertCanPost(user, classId);

        if (voice) {
            // Voice messages stand alone, like Discord's.
            if (content || files.length > 0) {
                throw new BadRequestError("Voice messages can't include text or files");
            }
            if (voiceDurationMs === undefined) {
                throw new BadRequestError("voiceDurationMs is required with a voice message");
            }
        } else if (!content && files.length === 0) {
            throw new BadRequestError("Message can't be empty");
        }

        if (replyTo) {
            const parent = await messagesRepository.findById(replyTo);
            if (!parent || parent.deletedAt || String(parent.class) !== classId) {
                throw new BadRequestError("The message you're replying to no longer exists");
            }
        }

        if (voice) await assertVoiceNoteAllowed(user.id, voice.size);

        // Files are stored only after every check has passed.
        const [attachmentKeys, [voiceKey]] = await Promise.all([
            saveUploads(files, UPLOAD_FOLDERS.ATTACHMENTS),
            saveUploads(voice ? [voice] : [], UPLOAD_FOLDERS.VOICE),
        ]);
        const storedKeys = [...attachmentKeys, voiceKey].filter(Boolean);

        let message;
        try {
            message = await messagesRepository.create({
                class: classId,
                author: user.id,
                content,
                replyTo: replyTo ?? null,
                attachments: files.map((file, index) => toAttachment(file, attachmentKeys[index])),
                voiceNote: voice
                    ? {
                          path: voiceKey,
                          mimeType: voice.mimetype,
                          size: voice.size,
                          durationMs: voiceDurationMs,
                      }
                    : null,
            });
        } catch (error) {
            await removeUploads(storedKeys);
            throw error;
        }

        await Promise.all([
            classesRepository.touchLastMessage(classId, message.createdAt),
            // Sending implies you've read everything above it.
            membershipRepository.markRead(user.id, classId),
        ]);

        return toMessageDTO(message);
    },

    editMessage: async (user, messageId, { content }) => {
        const message = await findLiveMessage(messageId);

        if (String(message.author?._id) !== user.id) {
            throw new ForbiddenError("You can only edit your own messages");
        }
        if (message.voiceNote) {
            throw new BadRequestError("Voice messages can't be edited");
        }
        await membershipService.assertCanPost(user, String(message.class));

        if (!content && message.attachments.length === 0) {
            throw new BadRequestError("Message can't be empty");
        }

        const updated = await messagesRepository.updateById(messageId, {
            content,
            editedAt: new Date(),
        });
        return toMessageDTO(updated);
    },

    deleteMessage: async (user, messageId) => {
        const message = await findLiveMessage(messageId);
        const isAuthor = String(message.author?._id) === user.id;

        if (!isAuthor) {
            const access = await membershipService.getAccess(user, String(message.class));
            const authorIsAdmin = message.author?.role === ROLES.ADMIN;

            if (!access.canModerate || (authorIsAdmin && !access.isAdmin)) {
                throw new ForbiddenError("You can't delete this message");
            }
        }

        // Soft delete: keep a tombstone so polling clients learn about it,
        // but drop the content and files right away.
        const deleted = await messagesRepository.updateById(messageId, {
            deletedAt: new Date(),
            content: "",
            attachments: [],
            voiceNote: null,
            reactions: [],
        });
        await removeUploads([
            ...message.attachments.map((a) => a.path),
            message.voiceNote?.path,
        ].filter(Boolean));

        return toMessageDTO(deleted);
    },

    toggleReaction: async (user, messageId, { emoji }) => {
        const message = await messagesRepository.findDocumentById(messageId);
        if (!message || message.deletedAt) throw new NotFoundError("Message not found");

        const access = await membershipService.assertCanRead(user, String(message.class));
        if (!access.isMember) throw new ForbiddenError("Join this class to react to messages");

        const reaction = message.reactions.find((r) => r.emoji === emoji);

        if (!reaction) {
            if (message.reactions.length >= MAX_DISTINCT_REACTIONS) {
                throw new BadRequestError("This message has too many different reactions");
            }
            message.reactions.push({ emoji, users: [user.id] });
        } else {
            const index = reaction.users.findIndex((id) => String(id) === user.id);
            if (index >= 0) reaction.users.splice(index, 1);
            else reaction.users.push(user.id);
        }

        message.reactions = message.reactions.filter((r) => r.users.length > 0);
        await message.save();

        return toMessageDTO(await messagesRepository.findById(messageId));
    },
};
