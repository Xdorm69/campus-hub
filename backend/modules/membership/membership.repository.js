
import prisma from "../../config/prisma.js";
import { handlePrismaError } from "../../utils/prismaErrorHandler.js";

const memberInclude = {
  user: {
    select: {
      id: true,
      username: true,
      bio: true,
      avatar: true,
      role: true
    },
  },
};

export const membershipRepository = {
  getClassMembers: async (classId) => {
    try {
      return await prisma.membership.findMany({
        where: { classId },
        include: memberInclude,
      });
    } catch (error) {
      handlePrismaError(error);
    }
  },

  getUserClasses: async (userId) => {
    try {
      return await prisma.membership.findMany({
        where: { userId },
        include: {
          class: true,
        },
      });
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
            classId,
          },
        },
        data: updates,
        include: memberInclude,
      });
    } catch (error) {
      handlePrismaError(error);
    }
  },

  createMembership: async (userId, classId) => {
    try {
      const [, membership] = await prisma.$transaction(async (tx) => [
        await tx.class.update({
          where: { id: classId },
          data: {
            memberCount: {
              increment: 1,
            },
          },
        }),
        await tx.membership.create({
          data: {
            userId,
            classId,
          },
          include: memberInclude,
        }),
      ]);

      return membership;
    } catch (error) {
      handlePrismaError(error);
    }
  },

  removeMembership: async (userId, classId) => {
    try {
      const [, membership] = await prisma.$transaction(async (tx) => [
        await tx.class.update({
          where: { id: classId },
          data: {
            memberCount: {
              decrement: 1,
            },
          },
        }),
        await tx.membership.delete({
          where: {
            userId_classId: {
              userId,
              classId,
            },
          },
          include: memberInclude,
        }),
      ]);

      return membership;
    } catch (error) {
      handlePrismaError(error);
    }
  },

  leaveClass: async (memberId, classId) => {
    try {
      return await prisma.membership.delete({
        where: {
          userId_classId: {
            userId: memberId,
            classId,
          },
        },
        include: memberInclude,
      });
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
            classId,
          },
        },
        include: memberInclude,
      });
    } catch (error) {
      handlePrismaError(error);
    }
  },
};