import pino from "pino";
import { envConfig } from "../config/env.js";

export const logger = pino({
  level: envConfig.LOG_LEVEL || "info",

  transport:
    envConfig.NODE_ENV !== "production"
      ? {
          target: "pino-pretty",
          options: {
            colorize: true,
            translateTime: "SYS:standard",
            ignore: "pid,hostname",
          },
        }
      : undefined,
});