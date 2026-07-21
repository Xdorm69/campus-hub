import { NotFoundError } from "../../utils/ApiError.js";
import { membershipRepository } from "../membership/membership.repository.js";
import { classesRepository } from "./classes.repository.js";

export const classesService = {
    getClasses: async (userId) => {
    const allClasses = await classesRepository.getClasses();

    if (allClasses.length === 0) {
        return [];
    }

    const userClasses = await membershipRepository.getUserClasses(userId);

    const memberClassIds = new Set(
        userClasses.map(cls => cls.classId)
    );

    return allClasses.map(cls => ({
        ...cls,
        isMember: memberClassIds.has(cls.id),
    }));
},
    getClassById: async (userId, classId) => {
        const classEl = await classesRepository.getClassById(classId);
        if (!classEl) throw new NotFoundError("Class not found");

        //valiation user role inside that class;
        const userClassEl = await membershipRepository.getMembership(userId, classId);

        //attaching role
        return {...classEl, isMember: !!userClassEl, isModerator: userClassEl?.isModerator || false};
    },
    createClass: async (data) => {
        const createdClass = await classesRepository.createClass(data);
        return createdClass;
    },
    updateClass: async (userId, classid, data) => {
        const classEl = await classesRepository.updateClass(classid, data);

        return classEl;
    },
    deleteClass: async (userId, classId) => {
        const classEl = await classesRepository.deleteClass(classId);
        if (!classEl) throw new NotFoundError("Class not found");
        return classEl;
    },
    getClassMembers: async (classId) => {
        const classE = await classesRepository.getClassById(classId);
        if (!classE) throw new NotFoundError("Class not found");

        const members = await membershipRepository.getClassMembers(classId);
        return members;
    }
}