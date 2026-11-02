import { ConflictError, NotFoundError } from "../../utils/ApiError.js";
import { removeUploads, saveUpload } from "../../utils/files.js";
import { ROLES } from "../../constants/roles.js";
import { UPLOAD_FOLDERS } from "../../constants/upload.js";
import userRepository from "./user.repository.js";
import { toUserDTO } from "./user.mapper.js";

async function findUserOrThrow(userId) {
    const user = await userRepository.findById(userId);
    if (!user) throw new NotFoundError("User not found");
    return user;
}

export const userService = {
    getProfile: async (userId) => {
        const user = await findUserOrThrow(userId);
        return toUserDTO(user, { includePrivate: true });
    },

    getProfileById: async (viewer, userId) => {
        const user = await findUserOrThrow(userId);
        const includePrivate = viewer.id === userId || viewer.role === ROLES.ADMIN;
        return toUserDTO(user, { includePrivate });
    },

    updateProfile: async (userId, data) => {
        if (data.username) {
            const existing = await userRepository.findByUsername(data.username);
            if (existing && String(existing._id) !== userId) {
                throw new ConflictError("Username is already taken.");
            }
        }

        // Choosing a preset (or none) replaces an uploaded banner.
        const choosingPreset = data.bannerPreset !== undefined;
        const previous = choosingPreset ? await findUserOrThrow(userId) : null;
        const updates = choosingPreset ? { ...data, bannerPath: null } : data;

        const user = await userRepository.updateById(userId, updates);
        if (!user) throw new NotFoundError("User not found");

        if (previous) await removeUploads([previous.bannerPath]);
        return toUserDTO(user, { includePrivate: true });
    },

    updateAvatar: (userId, file) =>
        replaceImage(userId, file, { field: "avatarPath", folder: UPLOAD_FOLDERS.AVATARS }),

    removeAvatar: (userId) => clearImage(userId, { avatarPath: null }, "avatarPath"),

    // An uploaded banner replaces any preset.
    updateBanner: (userId, file) =>
        replaceImage(userId, file, {
            field: "bannerPath",
            folder: UPLOAD_FOLDERS.BANNERS,
            extra: { bannerPreset: null },
        }),

    // Back to the default color: clears both the upload and any preset.
    removeBanner: (userId) => clearImage(userId, { bannerPath: null, bannerPreset: null }, "bannerPath"),
};

/**
 * Stores `file` as the user's new image in `field`, then deletes the one it
 * replaced — so each user holds at most one avatar and one banner.
 */
async function replaceImage(userId, file, { field, folder, extra = {} }) {
    const previous = await findUserOrThrow(userId);
    const key = await saveUpload(file, folder);

    let user;
    try {
        user = await userRepository.updateById(userId, { [field]: key, ...extra });
    } catch (error) {
        await removeUploads([key]);
        throw error;
    }

    await removeUploads([previous[field]]);
    return toUserDTO(user, { includePrivate: true });
}

async function clearImage(userId, updates, field) {
    const previous = await findUserOrThrow(userId);
    const user = await userRepository.updateById(userId, updates);

    await removeUploads([previous[field]]);
    return toUserDTO(user, { includePrivate: true });
}
