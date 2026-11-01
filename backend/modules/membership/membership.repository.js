import mongoose from "mongoose";
import { Membership } from "../../models/index.js";

const MEMBER_USER_FIELDS = "username avatarPath role bio createdAt";

export const membershipRepository = {
    findOne: (userId, classId) => Membership.findOne({ user: userId, class: classId }).lean(),

    findOneWithUser: (userId, classId) =>
        Membership.findOne({ user: userId, class: classId })
            .populate("user", MEMBER_USER_FIELDS)
            .lean(),

    findByClass: (classId) =>
        Membership.find({ class: classId })
            .populate("user", MEMBER_USER_FIELDS)
            .sort({ createdAt: 1 })
            .lean(),

    findByUser: (userId) => Membership.find({ user: userId }).lean(),

    create: async (data) => {
        const membership = await Membership.create(data);
        return membership.toObject();
    },

    update: (userId, classId, updates) =>
        Membership.findOneAndUpdate({ user: userId, class: classId }, updates, { returnDocument: "after" })
            .populate("user", MEMBER_USER_FIELDS)
            .lean(),

    remove: (userId, classId) => Membership.findOneAndDelete({ user: userId, class: classId }).lean(),

    removeByClass: (classId) => Membership.deleteMany({ class: classId }),

    markRead: (userId, classId) =>
        Membership.updateOne({ user: userId, class: classId }, { lastReadAt: new Date() }),

    /** Map of classId -> number of non-banned members. */
    countActiveByClass: async (classIds) => {
        const match = { banned: false };
        if (classIds) {
            match.class = { $in: classIds.map((id) => new mongoose.Types.ObjectId(String(id))) };
        }

        const rows = await Membership.aggregate([
            { $match: match },
            { $group: { _id: "$class", count: { $sum: 1 } } },
        ]);

        return new Map(rows.map((row) => [String(row._id), row.count]));
    },
};
