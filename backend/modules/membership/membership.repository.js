
import prisma from "../../config/prisma.js";
import { handlePrismaError } from "../../utils/prismaErrorHandler.js";

export const membershipRepository = {
    createMembership: async (userId, classId) => {
        try {
            const [classUpdate, membership] = await prisma.$transaction(async (tx) => [
                await tx.class.update({
                    where: {
                        id: classId
                    },
                    data: {
                        memberCount: {
                            increment: 1
                        }
                    }
                }),
                await tx.membership.create({
                    data: {
                        userId,
                        classId
                    }
                })
            ]);
            
            return membership;
        } catch (error) {
            handlePrismaError(error);
        }
    },
    getMembership: async (userId, classId) => {
        try {
            return await prisma.membership.findUnique({
                where: {
                    userId_classId: {
                        userId,
                        classId
                    }
                }
            });
        } catch (error) {
            handlePrismaError(error);
        }
    },
    getUserClasses: async (userId) => {
        try {
            return await prisma.membership.findMany({
                where: {
                    userId
                },
                include: {
                    class: true
                }
            });
        } catch (error) {
            handlePrismaError(error);
        }
    },
    getClassMembers: async (classId) => {
        try {
            return await prisma.membership.findMany({
                where: {
                    classId
                },
                include: {
                    user: {select: {username: true, bio: true, avatar: true}}
                }
            });
        } catch (error) {
            handlePrismaError(error);
        }
    },
    removeMembership: async (userId, classId) => {
        try {
            const [c, membership] = await prisma.$transaction(async (tx) => [
                await tx.class.update({
                    where: {
                        id: classId
                    },
                    data: {
                        memberCount: {
                            decrement: 1
                        }
                    }
                }),
                await tx.membership.delete({
                    where: {
                        userId_classId: {
                            userId,
                            classId
                        }
                    }
                })
            ])
            
            return membership;
        } catch (error) {
            handlePrismaError(error);
        }
    },
    updateMember: async (classId, memberId, updates) => {
        try {
            return await prisma.membership.update({
                where: {
                    userId_classId: {
                        userId: memberId,
                        classId: classId
                    }
                },
                data: updates
            });
        } catch (error) {
            handlePrismaError(error);
        }
    },
    leaveClass: async (memberId, classId ) => {
        try {
            return await prisma.membership.delete({
                where: {
                    userId_classId: {
                        userId: memberId,
                        classId: classId
                    }
                }
            });
        } catch (error) {
            handlePrismaError(error);
        }
    }
}