import express from "express";
import { uploadsController } from "./uploads.controller.js";

/**
 * Public file serving, mounted at /uploads (outside /api/v1 and its rate
 * limit, since a chat screen loads many images at once).
 */
const uploadsRouter = express.Router();

uploadsRouter.get("/:key", uploadsController.getFile);

export default uploadsRouter;
