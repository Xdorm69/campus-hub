import express from "express";
import cors from "cors";
import helmet from "helmet";
import compression from "compression";
import cookieParser from "cookie-parser";
import { pinoHttp } from "pino-http";
import routes from "../routes/routes.js";
import { errorHandler, notFoundHandler } from "../middleware/error.middleware.js";
import { apiLimiter } from "../utils/rateLimiter.js";
import { corsConfig } from "../config/cors.js";
import { pinoConfig } from "../config/pino.js";
import uploadsRouter from "../modules/uploads/uploads.router.js";

const app = express();

app.set("trust proxy", 1);
app.use(
    helmet({
        // Uploaded images are embedded by the frontend, which is another origin.
        crossOriginResourcePolicy: { policy: "cross-origin" },
    })
);
app.use(compression());
app.use(cors(corsConfig));
app.use(express.json({ limit: "100kb" }));
app.use(express.urlencoded({ extended: true }));
app.use(pinoHttp(pinoConfig));
app.use(cookieParser());

// Uploaded files, streamed from MongoDB GridFS.
app.use("/uploads", uploadsRouter);

app.use("/api/v1", apiLimiter, routes);
app.use(notFoundHandler);
app.use(errorHandler);

export default app;
