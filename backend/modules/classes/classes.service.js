import { ROLES } from "../../constants/roles.js";
import { NotFoundError } from "../../utils/ApiError.js";
import { removeUploads } from "../../utils/files.js";
import { membershipRepository } from "../membership/membership.repository.js";
import { membershipService } from "../membership/membership.service.js";
import { messagesRepository } from "../messages/messages.repository.js";
import { classesRepository } from "./classes.repository.js";
import { toClassDTO } from "./classes.mapper.js";

const isAdmin = (user) => user.role === ROLES.ADMIN;

export const classesService = {
    listClasses: async (user, { search } = {}) => {
        const [classes, memberCounts, memberships] = await Promise.all([
            classesRepository.list({ search }),
            membershipRepository.countActiveByClass(),
            membershipRepository.findByUser(user.id),
        ]);

        const membershipByClass = new Map(memberships.map((m) => [String(m.class), m]));

        return classes.map((classDoc) =>
            toClassDTO(classDoc, {
                memberCount: memberCounts.get(String(classDoc._id)) ?? 0,
                membership: membershipByClass.get(String(classDoc._id)),
                isAdmin: isAdmin(user),
            })
        );
    },

    getClass: async (user, classId) => {
        const { classDoc, membership } = await membershipService.getAccess(user, classId);
        const memberCounts = await membershipRepository.countActiveByClass([classId]);

        return toClassDTO(classDoc, {
            memberCount: memberCounts.get(classId) ?? 0,
            membership,
            isAdmin: isAdmin(user),
        });
    },

    /** Sidebar data: every class the user belongs to, with unread counts. */
    getJoinedClasses: async (user) => {
        const memberships = await membershipRepository.findByUser(user.id);
        if (memberships.length === 0) return [];

        const classIds = memberships.map((m) => m.class);
        const [classes, memberCounts, unreadCounts, mentionCounts] = await Promise.all([
            classesRepository.findByIds(classIds),
            membershipRepository.countActiveByClass(classIds),
            Promise.all(
                memberships.map((m) =>
                    m.banned ? 0 : messagesRepository.countUnread(m.class, user.id, m.lastReadAt)
                )
            ),
            Promise.all(
                memberships.map((m) =>
                    m.banned ? 0 : messagesRepository.countUnreadMentions(m.class, user.id, m.lastReadAt)
                )
            ),
        ]);

        const classById = new Map(classes.map((c) => [String(c._id), c]));

        return memberships
            .map((membership, index) => {
                const classDoc = classById.get(String(membership.class));
                if (!classDoc) return null;

                return toClassDTO(classDoc, {
                    memberCount: memberCounts.get(String(classDoc._id)) ?? 0,
                    membership,
                    isAdmin: isAdmin(user),
                    unreadCount: unreadCounts[index],
                    mentionCount: mentionCounts[index],
                });
            })
            .filter(Boolean)
            .sort((a, b) => a.name.localeCompare(b.name));
    },

    createClass: async (user, data) => {
        const created = await classesRepository.create({ ...data, createdBy: user.id });
        // The creator joins automatically and moderates their own class.
        const membership = await membershipRepository.create({
            user: user.id,
            class: created._id,
            isModerator: true,
        });

        return toClassDTO(created, { memberCount: 1, membership, isAdmin: isAdmin(user) });
    },

    updateClass: async (user, classId, data) => {
        const updated = await classesRepository.update(classId, data);
        if (!updated) throw new NotFoundError("Class not found");

        return classesService.getClass(user, classId);
    },

    deleteClass: async (user, classId) => {
        const classDoc = await classesRepository.findById(classId);
        if (!classDoc) throw new NotFoundError("Class not found");

        const filePaths = await messagesRepository.findFilePathsByClass(classId);

        await Promise.all([
            messagesRepository.removeByClass(classId),
            membershipRepository.removeByClass(classId),
        ]);
        await classesRepository.remove(classId);
        await removeUploads(filePaths);

        return { id: classId };
    },
};
