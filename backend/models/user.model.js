import mongoose from "mongoose";
import { ROLES } from "../constants/roles.js";
import { BANNER_PRESET_IDS } from "../constants/banners.js";

const userSchema = new mongoose.Schema(
    {
        username: {
            type: String,
            required: true,
            unique: true,
            trim: true,
            minlength: 3,
            maxlength: 20,
        },
        email: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true,
        },
        password: {
            type: String,
            required: true,
            select: false,
        },
        bio: {
            type: String,
            maxlength: 280,
            default: null,
        },
        // GridFS key of the uploaded avatar (see utils/files.js).
        avatarPath: {
            type: String,
            default: null,
        },
        // Profile banner: an uploaded image (GridFS key) or a built-in preset
        // id. At most one is set; neither means the default color.
        bannerPath: {
            type: String,
            default: null,
        },
        bannerPreset: {
            type: String,
            enum: [...BANNER_PRESET_IDS, null],
            default: null,
        },
        role: {
            type: String,
            enum: Object.values(ROLES),
            default: ROLES.USER,
        },
        verified: {
            type: Boolean,
            default: false,
        },
    },
    { timestamps: true }
);

export const User = mongoose.model("User", userSchema);
