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
import { envConfig } from "../config/env.js";
import { IMAGE_MIME_TYPES } from "../constants/upload.js";

const app = express();

const inlineExtensions = new Set(Object.values(IMAGE_MIME_TYPES));

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

// Uploaded files. Only images render inline; everything else downloads, so
// an uploaded document can never execute in this origin.
app.use(
    "/uploads",
    express.static(envConfig.UPLOAD_DIR, {
        index: false,
        maxAge: "7d",
        immutable: true,
        setHeaders: (res, filePath) => {
            const extension = filePath.slice(filePath.lastIndexOf(".")).toLowerCase();
            if (!inlineExtensions.has(extension)) {
                res.setHeader("Content-Disposition", "attachment");
            }
        },
    })
);

app.use("/api/v1", apiLimiter, routes);
app.use(notFoundHandler);
app.use(errorHandler);

export default app;
