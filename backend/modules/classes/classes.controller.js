import ApiResponse  from "../../utils/ApiResponse.js";
import { membershipService } from "../membership/membership.service.js";
import { postsService } from "../posts/posts.service.js";
import { classesService } from "./classes.service.js";

export const classesController = {
    getClasses: async (req, res) => {
        const classes = await classesService.getClasses(req.user.id);
        return res.status(200).json(new ApiResponse(200, classes, "Classes fetched successfully"));
    },
    getClassById: async (req, res) => {
        const classData = await classesService.getClassById(req.user.id ,req.params.id);
        return res.status(200).json(new ApiResponse(200, classData, "Class fetched successfully"));
    },
    createClass: async (req, res) => {
        const createdClass = await classesService.createClass(req.body);
        return res.status(201).json(new ApiResponse(201, createdClass, "Class created successfully"));
    },
    updateClass: async (req, res) => {
        const updatedClass = await classesService.updateClass(req.user.id, req.params.id, req.body);
        return res.status(200).json(new ApiResponse(200, updatedClass, "Class updated successfully"));
    },
    deleteClass: async (req, res) => {
        const deletedClass = await classesService.deleteClass(req.user.id, req.params.id);
        return res.status(200).json(new ApiResponse(200, deletedClass, "Class deleted successfully"));
    },
    getClassMembers: async (req, res) => {
        const members = await classesService.getClassMembers(req.params.classId);
        return res.status(200).json(new ApiResponse(200, members, "Class members fetched successfully"));
    },
    joinClass: async (req, res) => {
        const joinMembership = await membershipService.createMembership(req.user.id, req.params.classId);
        return res.status(201).json(new ApiResponse(201, joinMembership, "Class joined successfully"));
    },
    leaveClass: async (req, res) => {
        const leaveMembership = await membershipService.removeMembership(req.user.id, req.params.classId);
        return res.status(200).json(new ApiResponse(200, leaveMembership, "Class left successfully"));
    },
    updateUserStatus: async (req, res) => {
        const updatedUser = await membershipService.updateMembershipStatus(req.params.classId, req.params.memberId, req.user, req.body);
        return res.status(200).json(new ApiResponse(200, updatedUser, "User status updated successfully"));
    },
    forceExitRoom: async (req, res) => {
        const exitedUser = await membershipService.forceRemoveMembership(req.params.classId, req.params.memberId, req.user);
        return res.status(200).json(new ApiResponse(200, exitedUser, "User force exited successfully"));
    },
    getClassFeed: async (req, res) => {
        const searchParams = req.query;
        const posts = await postsService.getPostsByClassId(req.user.id, req.params.classId, searchParams);
        return res.status(200).json(new ApiResponse(200, posts, "Class feed fetched successfully"));
    }
}