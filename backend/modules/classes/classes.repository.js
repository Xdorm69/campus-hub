
import prisma from "../../config/prisma.js";
import {handlePrismaError} from "../../utils/prismaErrorHandler.js";

export const classesRepository = {
    getClasses: async () => {
        try {
            return await prisma.class.findMany();
        } catch (error) {
            handlePrismaError(error);
        }
    },
    getClassById: async (classId) => {
        try {
            return await prisma.class.findUnique({
                where: {
                    id: classId
                }
            });
        } catch (error) {
            handlePrismaError(error);
        }
    },
    createClass: async (data) => {
        try {
            return await prisma.class.create({
                data
            });
        } catch (error) {
            handlePrismaError(error);
        }
    },
    updateClass: async (id, data) => {
        try {
            return await prisma.class.update({
                where: {
                    id
                },
                data
            });
        } catch (error) {
            handlePrismaError(error);
        }
    },
    deleteClass: async (id) => {
        try {
            return await prisma.class.delete({
                where: {
                    id
                }
            });
        } catch (error) {
            handlePrismaError(error);
        }
    }    
}