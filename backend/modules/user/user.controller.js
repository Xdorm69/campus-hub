import ApiResponse from "../../utils/ApiResponse.js";
import { BadRequestError } from "../../utils/ApiError.js";
import { classesService } from "../classes/classes.service.js";
import { userService } from "./user.service.js";

export const userController = {
    getProfile: async (req, res) => {
        const profile = await userService.getProfile(req.user.id);
        ApiResponse.send(res, 200, profile, "Profile fetched successfully");
    },

    getProfileById: async (req, res) => {
        const profile = await userService.getProfileById(req.user, req.params.id);
        ApiResponse.send(res, 200, profile, "Profile fetched successfully");
    },

    updateProfile: async (req, res) => {
        const profile = await userService.updateProfile(req.user.id, req.body);
        ApiResponse.send(res, 200, profile, "Profile updated successfully");
    },

    updateAvatar: async (req, res) => {
        if (!req.file) throw new BadRequestError("Attach an image in the 'avatar' field");

        const profile = await userService.updateAvatar(req.user.id, req.file);
        ApiResponse.send(res, 200, profile, "Avatar updated successfully");
    },

    removeAvatar: async (req, res) => {
        const profile = await userService.removeAvatar(req.user.id);
        ApiResponse.send(res, 200, profile, "Avatar removed successfully");
    },

    updateBanner: async (req, res) => {
        if (!req.file) throw new BadRequestError("Attach an image in the 'banner' field");

        const profile = await userService.updateBanner(req.user.id, req.file);
        ApiResponse.send(res, 200, profile, "Banner updated successfully");
    },

    removeBanner: async (req, res) => {
        const profile = await userService.removeBanner(req.user.id);
        ApiResponse.send(res, 200, profile, "Banner removed successfully");
    },

    getUserClasses: async (req, res) => {
        const classes = await classesService.getJoinedClasses(req.user);
        ApiResponse.send(res, 200, classes, "User classes fetched successfully");
    },
};
