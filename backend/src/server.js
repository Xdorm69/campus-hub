import { envConfig } from "../config/env.js";
import { connectDatabase, disconnectDatabase } from "../config/db.js";
import { logger } from "../utils/logger.js";
import { startVoiceRetentionJob } from "../jobs/voice-retention.job.js";
import app from "./app.js";

async function start() {
    await connectDatabase();
    startVoiceRetentionJob();

    const server = app.listen(envConfig.PORT, () => {
        logger.info(`Server is running on http://localhost:${envConfig.PORT}`);
    });

    const shutdown = (signal) => {
        logger.info(`${signal} received, shutting down`);
        server.close(async () => {
            await disconnectDatabase();
            process.exit(0);
        });
    };

    process.on("SIGINT", shutdown);
    process.on("SIGTERM", shutdown);
}

start().catch((error) => {
    logger.fatal({ err: error }, "Failed to start server");
    process.exit(1);
});
