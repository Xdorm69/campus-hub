import express from "express";
import authRouter from "../modules/auth/auth.router.js";
import userRouter from "../modules/user/user.router.js";
import classesRouter from "../modules/classes/classes.router.js";
import { messageItemRouter } from "../modules/messages/messages.router.js";

const router = express.Router();

router.get("/health", (req, res) => res.json({ success: true, status: "ok" }));

router.use("/auth", authRouter);
router.use("/users", userRouter);
router.use("/classes", classesRouter);
router.use("/messages", messageItemRouter);

export default router;
