
import ApiResponse from "../../utils/ApiResponse.js";
import { postsService } from "../posts/posts.service.js";
import {userService} from "./user.service.js";

export const userController = {
 getProfile: async (req, res) => {
    const profile = await userService.getProfile(req.user.id);
    return res.status(200).json(new ApiResponse(200, profile, "Profile fetched successfully"));
 },
 getProfileById: async (req, res) => {
    const profile = await userService.getProfileById(req.params.id);
    return res.status(200).json(new ApiResponse(200, profile, "Profile fetched successfully"));
 },
 updateProfile: async (req, res) => {
    const updatedProfile = await userService.updateProfile(req.user.id, req.body);
    return res.status(200).json(new ApiResponse(200, updatedProfile, "Profile updated successfully"));
 },
 getUserClasses: async (req, res) => {
    const classes = await userService.getUserClasses(req.user.id);
    return res.status(200).json(new ApiResponse(200, classes, "User classes fetched successfully"));
 },
 getUserPosts: async (req, res) => {
    const posts = await postsService.getPostsByUserId(req.user.id);
    return res.status(200).json(new ApiResponse(200, posts, "User posts fetched successfully"));
 }
}
