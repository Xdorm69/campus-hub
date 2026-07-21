import express from "express";
import cors from "cors";
import routes from "../routes/routes.js";
import {errorHandler} from "../middleware/error.middleware.js";
import { pinoHttp } from "pino-http";
import cookieParser from "cookie-parser";
import helmet from "helmet";
import { apiLimiter } from "../utils/rateLimiter.js";
import { corsConfig } from "../config/cors.js";
import { pinoConfig } from "../config/pino.js";
import compression from "compression";

const app = express();

app.set("trust proxy", 1);
app.use(
  helmet({
    crossOriginResourcePolicy: false, // useful if serving images/files from another origin
  })
);
app.use(compression());
app.use(cors(corsConfig));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(
  pinoHttp(pinoConfig)
);
app.use(cookieParser());

app.use('/api/v1', apiLimiter, routes);
app.use(errorHandler);

export default app;