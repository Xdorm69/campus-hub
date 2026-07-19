import express from "express";
import cors from "cors";
import routes from "../routes/routes.js";
import {errorHandler} from "../middleware/error.middleware.js";
import { logger } from "../utils/logger.js";
import { pinoHttp } from "pino-http";
import cookieParser from "cookie-parser";
import { envConfig } from "../config/env.js";

const app = express();

app.use(cors({
    origin: envConfig.FRONTEND_URL,
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) {
        return {
          method: req.method,
          url: req.url,
        };
      },

      res(res) {
        return {
          statusCode: res.statusCode,
        };
      },
    },
  })
);
app.use(cookieParser());

app.use('/api/v1', routes);
app.use(errorHandler);

export default app;