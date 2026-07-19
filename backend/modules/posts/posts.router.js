import express from 'express';
import authenticate from '../../middleware/authenticate.middleware.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import {postsController} from './posts.controller.js';
import { validate } from '../../middleware/validate.middleware.js';
import { postsUploadSchema, updatePostSchema } from './posts.validator.js';

const postsRouter = express.Router();

//add posts
postsRouter.post("/", authenticate, validate(postsUploadSchema), asyncHandler(postsController.createPost));
//update posts
postsRouter.put("/:postId", authenticate, validate(updatePostSchema), asyncHandler(postsController.updatePost));
//delete posts
postsRouter.delete("/:postId", authenticate, asyncHandler(postsController.deletePost));

export default postsRouter;