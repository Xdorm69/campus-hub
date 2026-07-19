import prisma from "../../config/prisma.js"
import { handlePrismaError } from "../../utils/prismaErrorHandler.js";

const userRepository = {
    findById: async (id) => {
        try {
            const profile = await prisma.user.findUnique({
                where: {
                    id
                },
                select: {
                    id: true,
                    username: true,
                    email: true,
                    bio: true,
                    avatar: true,
                    verified: true,
                    role: true,
                    createdAt: true,
                    updatedAt: true
                }
            });
            return profile;
        } catch (error) {
            handlePrismaError(error);
        }
    },
    updateProfile: async (id, data) => {
        try {
            const updatedProfile = await prisma.user.update({
                where: {
                    id
                },
                select: {
                    id: true,
                    username: true,
                    email: true,
                    bio: true,
                    avatar: true,
                    verified: true,
                    role: true,
                    createdAt: true,
                    updatedAt: true
                },
                data
            });
            return updatedProfile;
        } catch (error) {
            handlePrismaError(error);
        }
    }
}

export default userRepository;
