import prisma from "../../config/prisma.js";
import { handlePrismaError } from "../../utils/prismaErrorHandler.js";

export const postsRepository = {
    createPost: async (userId, postData) => {
        try {
            return await prisma.post.create({data: {...postData, authorId: userId}, include: {author: {select: {username: true, avatar: true}}}})
        } catch (error) {
            handlePrismaError(error);
        }
    },
    getPostById: async (postId) => {
        try {
            return await prisma.post.findUnique({where: {id: postId}});
        } catch (error) {
            handlePrismaError(error);
        }
    },
    getPostsByClassId: async (classId, searchParams) => {
        const limit = Number(searchParams.limit) || 10;
        const cursor = searchParams.cursor ?? null;

        try {

            const posts = await prisma.post.findMany({

                where: {
                    classId,
                    deletedAt: null,
                },
                include: {
                    author: {
                        select: {
                            username: true,
                            avatar: true
                        }
                    }
                },

                orderBy: {
                    createdAt: "desc",
                },

                take: limit,

                ...(cursor && {
                    skip: 1,
                    cursor: {
                        id: cursor,
                    },
                }),

            });

            const nextCursor =
                posts.length === limit
                    ? posts[posts.length - 1].id
                    : null;

            return {
                posts,
                nextCursor,
            };

        } catch (error) {
            handlePrismaError(error);
        }
    },
    getPostsByUserId: async (userId) => {
        try {
            return await prisma.post.findMany({where: {authorId: userId, deletedAt: null}});
        } catch (error) {
            handlePrismaError(error);
        }
    },
    updatePost: async (postId, postData) => {
        try {
            return await prisma.post.update({where: {id: postId}, data: postData});
        } catch (error) {
            handlePrismaError(error);
        }
    },
    deletePost: async (postId) => {
        try {
            return await prisma.post.update({where: {id: postId}, data: {deletedAt: new Date()}});
        } catch (error) {
            handlePrismaError(error);
        }
    }
}