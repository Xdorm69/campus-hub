 import {postsRepository} from "./posts.repository.js";
import { membershipService } from "../membership/membership.service.js";
import { ForbiddenError } from "../../utils/ApiError.js";

 export const postsService = {
    createPost: async (userId, data) => {
        //if user is not a member dont share posts [ensures valid membership];
        await membershipService.getMembership(userId, data.classId);

        const post = await postsRepository.createPost(userId, data);
        return post;
    },
    getPostsByClassId: async (userId, classId, searchParams) => {
        console.log({
            userId,
            classId,
            searchParams,
        });
        //if user is not a member dont share posts [ensures valid membership];
        await membershipService.getMembership(userId, classId);
        //fetch posts
        const posts = await postsRepository.getPostsByClassId(classId, searchParams);
        return posts;
    },
    getPostsByUserId: async (userId) => {
        //no membership check as it will be a dashboard route and shall return all potss;
        const posts = await postsRepository.getPostsByUserId(userId);
        return posts;
    },
    updatePost: async (userId, postId, postData) => {
        //check if user is the owner of the post
        const post = await postsRepository.getPostById(postId);
        if (post.authorId !== userId) {
            throw new ForbiddenError("You are not authorized to update this post");
        }
        const updatedPost = await postsRepository.updatePost(postId, postData);
        return updatedPost;
    },
    deletePost: async (userId, postId) => {
        //check if user is the owner of the post
        const post = await postsRepository.getPostById(postId);
        if (post.authorId !== userId) {
            throw new ForbiddenError("You are not authorized to update this post");
        }
        const deletedPost = await postsRepository.deletePost(postId);
        return deletedPost;
    }
 }