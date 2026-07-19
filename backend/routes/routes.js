import express from "express";
import authRouter from "../modules/auth/auth.router.js";
import userRouter from "../modules/user/user.router.js";
import classesRouter from "../modules/classes/classes.router.js";
import postsRouter from "../modules/posts/posts.router.js";

const router = express.Router();

router.use("/auth", authRouter);
router.use("/users", userRouter);
router.use("/classes", classesRouter);
router.use("/posts", postsRouter)

export default router;