import { Message } from "../../models/index.js";

const AUTHOR_FIELDS = "username avatarPath role";

const MESSAGE_POPULATE = [
    { path: "author", select: AUTHOR_FIELDS },
    {
        path: "replyTo",
        select: "author content attachments deletedAt",
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

    findAttachmentPathsByClass: async (classId) => {
        const messages = await Message.find(
            { class: classId, "attachments.0": { $exists: true } },
            { "attachments.path": 1 }
        ).lean();

        return messages.flatMap((message) => message.attachments.map((a) => a.path));
    },

    removeByClass: (classId) => Message.deleteMany({ class: classId }),
};
