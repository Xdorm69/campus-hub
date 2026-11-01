import ApiResponse from "../../utils/ApiResponse.js";
import { membershipService } from "../membership/membership.service.js";
import { classesService } from "./classes.service.js";

export const classesController = {
    getClasses: async (req, res) => {
        const classes = await classesService.listClasses(req.user, req.validated.query);
        ApiResponse.send(res, 200, classes, "Classes fetched successfully");
    },

    getClassById: async (req, res) => {
        const classData = await classesService.getClass(req.user, req.params.classId);
        ApiResponse.send(res, 200, classData, "Class fetched successfully");
    },

    createClass: async (req, res) => {
        const created = await classesService.createClass(req.user, req.body);
        ApiResponse.send(res, 201, created, "Class created successfully");
    },

    updateClass: async (req, res) => {
        const updated = await classesService.updateClass(req.user, req.params.classId, req.body);
        ApiResponse.send(res, 200, updated, "Class updated successfully");
    },

    deleteClass: async (req, res) => {
        const deleted = await classesService.deleteClass(req.user, req.params.classId);
        ApiResponse.send(res, 200, deleted, "Class deleted successfully");
    },

    joinClass: async (req, res) => {
        const membership = await membershipService.join(req.user, req.params.classId);
        ApiResponse.send(res, 201, membership, "Class joined successfully");
    },

    leaveClass: async (req, res) => {
        const result = await membershipService.leave(req.user, req.params.classId);
        ApiResponse.send(res, 200, result, "Class left successfully");
    },

    markRead: async (req, res) => {
        const result = await membershipService.markRead(req.user, req.params.classId);
        ApiResponse.send(res, 200, result, "Class marked as read");
    },

    getClassMembers: async (req, res) => {
        const members = await membershipService.getMembers(req.user, req.params.classId);
        ApiResponse.send(res, 200, members, "Class members fetched successfully");
    },

    updateMemberStatus: async (req, res) => {
        const member = await membershipService.updateMemberStatus(
            req.user,
            req.params.classId,
            req.params.memberId,
            req.body
        );
        ApiResponse.send(res, 200, member, "Member updated successfully");
    },

    removeMember: async (req, res) => {
        const result = await membershipService.removeMember(
            req.user,
            req.params.classId,
            req.params.memberId
        );
        ApiResponse.send(res, 200, result, "Member removed successfully");
    },
};
