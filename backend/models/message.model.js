import mongoose from "mongoose";

const attachmentSchema = new mongoose.Schema({
    // Path relative to the upload dir, e.g. "attachments/<uuid>.pdf".
    path: { type: String, required: true },
    originalName: { type: String, required: true },
    mimeType: { type: String, required: true },
    size: { type: Number, required: true },
});

const reactionSchema = new mongoose.Schema(
    {
        emoji: { type: String, required: true },
        users: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    },
    { _id: false }
);

const messageSchema = new mongoose.Schema(
    {
        class: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Class",
            required: true,
        },
        author: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        content: {
            type: String,
            default: "",
            maxlength: 4000,
        },
        attachments: [attachmentSchema],
        replyTo: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Message",
            default: null,
        },
        reactions: [reactionSchema],
        editedAt: { type: Date, default: null },
        deletedAt: { type: Date, default: null },
    },
    { timestamps: true }
);

// Cursor pagination walks _id (time-ordered) backwards within a class.
messageSchema.index({ class: 1, _id: -1 });
// Polling sync asks "what changed in this class since T?".
messageSchema.index({ class: 1, updatedAt: 1 });

export const Message = mongoose.model("Message", messageSchema);
