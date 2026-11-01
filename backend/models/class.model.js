import mongoose from "mongoose";

const classSchema = new mongoose.Schema(
    {
        code: {
            type: String,
            required: true,
            unique: true,
            uppercase: true,
            trim: true,
        },
        name: {
            type: String,
            required: true,
            unique: true,
            trim: true,
        },
        description: {
            type: String,
            default: "",
            maxlength: 500,
        },
        createdBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            default: null,
        },
        // Bumped on every new message so the sidebar can sort by activity.
        lastMessageAt: {
            type: Date,
            default: null,
        },
    },
    { timestamps: true }
);

export const ClassRoom = mongoose.model("Class", classSchema);
