 import ApiResponse from "../../utils/ApiResponse.js";
import {postsService} from "./posts.service.js";

 export const postsController = {
    createPost: async (req, res) => {
        const post = await postsService.createPost(req.user.id, req.body);
        res.status(201).json(new ApiResponse(201, post, "Post created successfully"));
    },
    updatePost: async (req, res) => {
        const post = await postsService.updatePost(req.user.id, req.params.postId, req.body);
        res.status(200).json(new ApiResponse(200, post, "Post updated successfully"));
    },
    deletePost: async (req, res) => {
        const post = await postsService.deletePost(req.user.id, req.params.postId);
        res.status(200).json(new ApiResponse(200, post, "Post deleted successfully"));
    }
 }