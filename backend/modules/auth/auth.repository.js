import prisma from "../../config/prisma.js";
import { handlePrismaError } from "../../utils/prismaErrorHandler.js";

const authRepository = {

    async create(data) {

        try {

            return await prisma.user.create({
                data
            });

        } catch (err) {
            handlePrismaError(err);

        }

    },

    async findByEmailOrUsername({ email, username }) {

        try {

            return await prisma.user.findFirst({

                where: {

                    OR: [

                        { email },

                        { username }

                    ]

                }

            });

        } catch (err) {

            handlePrismaError(err);

        }

    },

    async findByEmail(email) {
        try {
            return await prisma.user.findUnique({where: {email}});
        } catch (error) {
            handlePrismaError(error);
        }
    }

};

export default authRepository;