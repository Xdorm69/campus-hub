import mongoose from "mongoose";
import { Message } from "../../models/index.js";

const AUTHOR_FIELDS = "username avatarPath role";

const MESSAGE_POPULATE = [
    { path: "author", select: AUTHOR_FIELDS },
    { path: "mentions", select: "username" },
    {
        path: "replyTo",
        select: "author content attachments voiceNote gif deletedAt",
        populate: { path: "author", select: AUTHOR_FIELDS },
    },
];

export const messagesRepository = {
    findById: (messageId) => Message.findById(messageId).populate(MESSAGE_POPULATE).lean(),

    /** Raw document (not lean) for read-modify-write updates like reactions. */
    findDocumentById: (messageId) => Message.findById(messageId),

    /**
     * One page of live messages, newest first. Fetches `limit + 1` so the
     * caller can tell whether an older page exists without a count query.
     */
    findPage: (classId, { before, limit }) => {
        const filter = { class: classId, deletedAt: null };
        if (before) filter._id = { $lt: before };

        return Message.find(filter)
            .sort({ _id: -1 })
            .limit(limit + 1)
            .populate(MESSAGE_POPULATE)
            .lean();
    },

    /**
     * Everything created, edited, reacted to, or deleted after `since`.
     * Deleted messages are included so clients can drop them.
     */
    findChangedSince: (classId, since, limit) =>
        Message.find({ class: classId, updatedAt: { $gt: since } })
            .sort({ updatedAt: 1 })
            .limit(limit + 1)
            .populate(MESSAGE_POPULATE)
            .lean(),

    create: async (data) => {
        const message = await Message.create(data);
        return messagesRepository.findById(message._id);
    },

    updateById: (messageId, update) =>
        Message.findByIdAndUpdate(messageId, update, { returnDocument: "after", runValidators: true })
            .populate(MESSAGE_POPULATE)
            .lean(),

    countUnread: (classId, userId, since) =>
        Message.countDocuments(
            {
                class: classId,
                author: { $ne: userId },
                deletedAt: null,
                createdAt: { $gt: since },
            },
            // The UI caps the badge at "99+", no need to count further.
            { limit: 100 }
        ),

    countUnreadMentions: (classId, userId, since) =>
        Message.countDocuments(
            {
                class: classId,
                mentions: userId,
                author: { $ne: userId },
                deletedAt: null,
                createdAt: { $gt: since },
            },
            { limit: 100 }
        ),

    /** Every stored file key (attachments + voice notes) in a class. */
    findFilePathsByClass: async (classId) => {
        const messages = await Message.find(
            {
                class: classId,
                $or: [{ "attachments.0": { $exists: true } }, { "voiceNote.path": { $type: "string" } }],
            },
            { "attachments.path": 1, "voiceNote.path": 1 }
        ).lean();

        return messages.flatMap((message) => [
            // Expired videos have no stored file (path null).
            ...(message.attachments ?? []).map((a) => a.path).filter(Boolean),
            ...(message.voiceNote?.path ? [message.voiceNote.path] : []),
        ]);
    },

    /** Count and bytes of an author's voice notes created since `since`. */
    voiceUsageByAuthorSince: async (authorId, since) => {
        const [row] = await Message.aggregate([
            {
                $match: {
                    author: new mongoose.Types.ObjectId(String(authorId)),
                    createdAt: { $gte: since },
                    voiceNote: { $ne: null },
                },
            },
            { $group: { _id: null, bytes: { $sum: "$voiceNote.size" }, count: { $sum: 1 } } },
        ]);

        return { bytes: row?.bytes ?? 0, count: row?.count ?? 0 };
    },

    /** Count and bytes of an author's video attachments created since `since`. */
    videoUsageByAuthorSince: async (authorId, since) => {
        const [row] = await Message.aggregate([
            {
                $match: {
                    author: new mongoose.Types.ObjectId(String(authorId)),
                    createdAt: { $gte: since },
                    "attachments.mimeType": { $regex: /^video\// },
                },
            },
            { $unwind: "$attachments" },
            { $match: { "attachments.mimeType": { $regex: /^video\// } } },
            { $group: { _id: null, bytes: { $sum: "$attachments.size" }, count: { $sum: 1 } } },
        ]);

        return { bytes: row?.bytes ?? 0, count: row?.count ?? 0 };
    },

    /** Messages created before `before` that still have a stored video. */
    findVideoMessagesOlderThan: (before, limit) =>
        Message.find(
            {
                createdAt: { $lt: before },
                attachments: { $elemMatch: { mimeType: /^video\//, path: { $type: "string" } } },
            },
            { attachments: 1 }
        )
            .sort({ createdAt: 1 })
            .limit(limit)
            .lean(),

    /** Drops the stored file of every video attachment on these messages. */
    expireVideoAttachments: (messageIds) =>
        Message.updateMany(
            { _id: { $in: messageIds } },
            { $set: { "attachments.$[video].path": null, "attachments.$[video].expiredAt": new Date() } },
            { arrayFilters: [{ "video.mimeType": /^video\//, "video.path": { $type: "string" } }] }
        ),

    /** Oldest voice notes whose audio is still stored, created before `before`. */
    findVoiceNotesOlderThan: (before, limit) =>
        Message.find(
            { "voiceNote.path": { $type: "string" }, createdAt: { $lt: before } },
            { "voiceNote.path": 1 }
        )
            .sort({ createdAt: 1 })
            .limit(limit)
            .lean(),

    /** Drops the audio reference but keeps the message ("voice message expired"). */
    expireVoiceNotes: (messageIds) =>
        Message.updateMany(
            { _id: { $in: messageIds } },
            { $set: { "voiceNote.path": null, "voiceNote.expiredAt": new Date() } }
        ),

    removeByClass: (classId) => Message.deleteMany({ class: classId }),
};
