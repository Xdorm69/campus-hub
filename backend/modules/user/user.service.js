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

        const user = await userRepository.updateById(userId, data);
        if (!user) throw new NotFoundError("User not found");
        return toUserDTO(user, { includePrivate: true });
    },

    updateAvatar: async (userId, file) => {
        const previous = await findUserOrThrow(userId);
        const key = await saveUpload(file, UPLOAD_FOLDERS.AVATARS);

        let user;
        try {
            user = await userRepository.updateById(userId, { avatarPath: key });
        } catch (error) {
            await removeUploads([key]);
            throw error;
        }

        await removeUploads([previous.avatarPath]);
        return toUserDTO(user, { includePrivate: true });
    },

    removeAvatar: async (userId) => {
        const previous = await findUserOrThrow(userId);
        const user = await userRepository.updateById(userId, { avatarPath: null });

        await removeUploads([previous.avatarPath]);
        return toUserDTO(user, { includePrivate: true });
    },
};
