import mongoose from "mongoose";

const attachmentSchema = new mongoose.Schema({
    // GridFS key, e.g. "<objectId>.pdf" (see utils/files.js).
    path: { type: String, required: true },
    originalName: { type: String, required: true },
    mimeType: { type: String, required: true },
    size: { type: Number, required: true },
});

const voiceNoteSchema = new mongoose.Schema(
    {
        // GridFS key; null once the retention job has deleted the audio.
        path: { type: String, default: null },
        mimeType: { type: String, required: true },
        size: { type: Number, required: true },
        // Reported by the recorder (WebM from MediaRecorder carries no
        // duration of its own); only used for display.
        durationMs: { type: Number, required: true },
        expiredAt: { type: Date, default: null },
    },
    { _id: false }
);

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
        voiceNote: { type: voiceNoteSchema, default: null },
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
// Per-user voice quota: "this author's voice notes in the last 24h".
messageSchema.index({ author: 1, createdAt: -1 });
// Retention job: "voice notes with audio still stored, oldest first".
messageSchema.index(
    { createdAt: 1 },
    { partialFilterExpression: { "voiceNote.path": { $type: "string" } } }
);

export const Message = mongoose.model("Message", messageSchema);
