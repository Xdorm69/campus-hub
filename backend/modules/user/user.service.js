import { NotFoundError } from "../../utils/ApiError.js";
import { membershipRepository } from "../membership/membership.repository.js";
import userRepository from "./user.repository.js";

export const userService = {
    getProfile: async (userId) => {
        const profile = await userRepository.findById(userId);
        return profile;
    },
    updateProfile: async (userId, data) => {
        const updatedProfile = await userRepository.updateProfile(userId, data);
        return updatedProfile;
    },
    getProfileById: async (userId) => {
        const profile = await userRepository.findById(userId);
        if (!profile) throw new NotFoundError("Profile not found");
        return profile;
    },
    getUserClasses: async (userId) => {
        const classes = await membershipRepository.getUserClasses(userId);
        //flatening due to frontend req
        const flatClasses = classes.map((classItem) => ({...classItem.class,isMember: true, isBanned: classItem.banned, isMuted: classItem.muted, isModerator: classItem.isModerator }));
        return flatClasses;
    }
}
