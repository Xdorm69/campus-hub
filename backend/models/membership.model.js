import mongoose from "mongoose";

const membershipSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        class: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Class",
            required: true,
        },
        isModerator: { type: Boolean, default: false },
        muted: { type: Boolean, default: false },
        banned: { type: Boolean, default: false },
        // Messages created after this are counted as unread.
        lastReadAt: { type: Date, default: Date.now },
    },
    { timestamps: true }
);

membershipSchema.index({ user: 1, class: 1 }, { unique: true });
membershipSchema.index({ class: 1 });

export const Membership = mongoose.model("Membership", membershipSchema);
