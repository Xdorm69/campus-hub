import { logger } from "../utils/logger.js";

export const pinoConfig = {
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
  }