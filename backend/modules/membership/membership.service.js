import { ROLES } from "../../constants/roles.js";
import { ConflictError, ForbiddenError, NotFoundError } from "../../utils/ApiError.js";
import { classesRepository } from "../classes/classes.repository.js";
import { membershipRepository } from "./membership.repository.js";
import { toMemberDTO } from "./membership.mapper.js";

/**
 * Resolves what `user` is allowed to do inside a class. Every class-scoped
 * feature (messages, members, moderation) goes through here so the rules
 * live in one place.
 */
async function getAccess(user, classId) {
    const [classDoc, membership] = await Promise.all([
        classesRepository.findById(classId),
        membershipRepository.findOne(user.id, classId),
    ]);

    if (!classDoc) throw new NotFoundError("Class not found");

    const isAdmin = user.role === ROLES.ADMIN;
    const isBanned = Boolean(membership?.banned);
    const isMember = Boolean(membership) && !isBanned;

    return {
        classDoc,
        membership,
        isAdmin,
        isBanned,
        isMember,
        canModerate: isAdmin || (isMember && membership.isModerator),
    };
}

async function assertCanRead(user, classId) {
    const access = await getAccess(user, classId);

    if (access.isBanned) throw new ForbiddenError("You are banned from this class");
    if (!access.isMember && !access.isAdmin) {
        throw new ForbiddenError("Join this class to see its messages");
    }

    return access;
}

async function assertCanPost(user, classId) {
    const access = await assertCanRead(user, classId);

    if (!access.isMember) throw new ForbiddenError("Join this class to send messages");
    if (access.membership.muted) throw new ForbiddenError("You are muted in this class");

    return access;
}

/**
 * Shared checks for acting on another member (mute/ban/kick/promote).
 * Admins can act on anyone but other admins; moderators only on regular members.
 */
async function assertCanModerateMember(actor, classId, memberId) {
    const access = await getAccess(actor, classId);
    if (!access.canModerate) {
        throw new ForbiddenError("Only class moderators or admins can manage members");
    }

    const target = await membershipRepository.findOneWithUser(memberId, classId);
    if (!target) throw new NotFoundError("Member not found");

    if (String(target.user._id) === actor.id) {
        throw new ForbiddenError("You cannot moderate yourself");
    }
    if (target.user.role === ROLES.ADMIN) {
        throw new ForbiddenError("You cannot moderate an admin");
    }
    if (!access.isAdmin && target.isModerator) {
        throw new ForbiddenError("You cannot moderate another moderator");
    }

    return { access, target };
}

export const membershipService = {
    getAccess,
    assertCanRead,
    assertCanPost,

    getMembers: async (user, classId) => {
        const access = await getAccess(user, classId);
        if (access.isBanned) throw new ForbiddenError("You are banned from this class");

        const members = await membershipRepository.findByClass(classId);
        // Memberships whose user was deleted have nothing to show.
        return members.filter((member) => member.user).map(toMemberDTO);
    },

    join: async (user, classId) => {
        const { membership } = await getAccess(user, classId);

        if (membership?.banned) throw new ForbiddenError("You are banned from this class");
        if (membership) throw new ConflictError("You are already a member of this class");

        await membershipRepository.create({ user: user.id, class: classId });
        return toMemberDTO(await membershipRepository.findOneWithUser(user.id, classId));
    },

    leave: async (user, classId) => {
        const { membership } = await getAccess(user, classId);

        if (!membership) throw new ConflictError("You are not a member of this class");
        // Leaving would delete the membership and with it the ban.
        if (membership.banned) throw new ForbiddenError("You are banned from this class");

        await membershipRepository.remove(user.id, classId);
        return { classId };
    },

    markRead: async (user, classId) => {
        await membershipRepository.markRead(user.id, classId);
        return { classId, lastReadAt: new Date() };
    },

    updateMemberStatus: async (actor, classId, memberId, data) => {
        const { access } = await assertCanModerateMember(actor, classId, memberId);

        if (data.role !== undefined && !access.isAdmin) {
            throw new ForbiddenError("Only admins can change moderator status");
        }

        const updates = {};
        if (data.isMuted !== undefined) updates.muted = data.isMuted;
        if (data.isBanned !== undefined) updates.banned = data.isBanned;
        if (data.role !== undefined) updates.isModerator = data.role === "MODERATOR";
        // A banned user can't keep moderator powers.
        if (data.isBanned) updates.isModerator = false;

        const updated = await membershipRepository.update(memberId, classId, updates);
        return toMemberDTO(updated);
    },

    removeMember: async (actor, classId, memberId) => {
        await assertCanModerateMember(actor, classId, memberId);

        const removed = await membershipRepository.remove(memberId, classId);
        return { id: String(removed._id), userId: memberId };
    },
};
