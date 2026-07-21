
import { membershipRepository } from "./membership.repository.js";
import { classesService } from "../classes/classes.service.js";
import { userService } from "../user/user.service.js";
import userRepository from "../user/user.repository.js";
import { classesRepository } from "../classes/classes.repository.js";
import { ConflictError, ForbiddenError, NotFoundError } from "../../utils/ApiError.js";

export const membershipService = {
    getMembership: async (userId, classId) => {
        //it will handle not found errors
        const [user, classEl] = await Promise.all([
            userService.getProfileById(userId),
            classesService.getClassById(userId, classId)
        ]);

        const membership = await membershipRepository.getMembership(userId, classId);
        return membership;
    },
    createMembership: async (userId, classId) => {
        const [user, classEl, membership] = await Promise.all([
            userRepository.findById(userId),
            classesRepository.getClassById(classId),
            membershipRepository.getMembership(userId, classId)
        ]);
        if (!user) throw new NotFoundError("User not found");
        if (!classEl) throw new NotFoundError("Class not found");
        if (membership) throw new ConflictError("User is already a member of this class");
        
        const newMembership = await membershipRepository.createMembership(userId, classId);
        return newMembership;
    },
    removeMembership: async (userId, classId) => {
        const [user, classEl, membership] = await Promise.all([
            userRepository.findById(userId),
            classesRepository.getClassById(classId),
            membershipRepository.getMembership(userId, classId)
        ]);
        if (!user) throw new NotFoundError("User not found");
        if (!classEl) throw new NotFoundError("Class not found");
        if (!membership) throw new ConflictError("User is not a member of this class");
        const leftClass = await membershipRepository.removeMembership(userId, classId);
        return leftClass;
    },
    updateMembershipStatus: async (classId, memberId, currentUser, data) => {
        // Ensure class exists
        const classEntity = await classesRepository.getClassById(classId);
        if (!classEntity) {
            throw new NotFoundError("Class not found");
        }

        // Target membership
        const targetMembership = await membershipRepository.getMembership(memberId, classId);
        if (!targetMembership) {
            throw new NotFoundError("Member not found");
        }

        //cannot change status of admin
        if (targetMembership.user.role === "ADMIN") {
            throw new ForbiddenError("You cannot update the status of an admin");
        }

        // Cannot modify yourself
        if (targetMembership.userId === currentUser.id) {
            throw new ForbiddenError("You cannot update your own status");
        }

        // If not a global admin, must be a moderator of this class
        if (currentUser.role !== "ADMIN") {
            const actorMembership = await membershipRepository.getMembership(
                currentUser.id,
                classId
            );

            if (!actorMembership || !actorMembership.isModerator) {
                throw new ForbiddenError(
                    "Only class moderators or admins can update members."
                );
            }

            // Moderators cannot change moderator status
            if (data.role !== undefined) {
                throw new ForbiddenError(
                    "Only admins can change moderator status."
                );
            }

            // Moderators cannot act on other moderators
            if (targetMembership.isModerator) {
                throw new ForbiddenError(
                    "You cannot modify another moderator."
                );
            }
        }

        const updates = {};

        if (data.isMuted !== undefined) {
            updates.muted = data.isMuted;
        }

        if (data.isBanned !== undefined) {
            updates.banned = data.isBanned;
        }

        // Only admins reach here if role is present
        if (data.role !== undefined) {
            updates.isModerator = data.role === "MODERATOR";
        }

        return await membershipRepository.updateMember(
            classId,
            memberId,
            updates
        );
    },
    forceRemoveMembership: async (classId, memberId, currentUser) => {
        
        // Ensure class exists
        const classEntity = await classesRepository.getClassById(classId);
        if (!classEntity) {
            throw new NotFoundError("Class not found");
        }
        
        // Target membership
        const targetMembership = await membershipRepository.getMembership(memberId, classId);
        if (!targetMembership) {
            throw new NotFoundError("Member not found");
        }
        
        //cannot force remove an admin
        if (targetMembership.user.role === "ADMIN") {
            throw new ForbiddenError("You cannot force exit an admin");
        }

        // Cannot modify yourself
        if (targetMembership.userId === currentUser.id) {
            throw new ForbiddenError("You cannot force exit yourself");
        }

        // If not a global admin, must be a moderator of this class
        if (currentUser.role !== "ADMIN") {
            const actorMembership = await membershipRepository.getMembershipByUserId(
                classId,
                currentUser.id
            );

            if (!actorMembership || !actorMembership.isModerator) {
                throw new ForbiddenError(
                    "Only class moderators or admins can force exit members."
                );
            }

            // Moderators cannot act on other moderators
            if (targetMembership.isModerator) {
                throw new ForbiddenError(
                    "You cannot force exit another moderator."
                );
            }
        }

        return await membershipRepository.leaveClass(memberId, classId);
    }
}