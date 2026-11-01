import mongoose from "mongoose";
import { envConfig } from "./env.js";
import { logger } from "../utils/logger.js";

mongoose.set("strictQuery", true);

export async function connectDatabase() {
    mongoose.connection.on("disconnected", () => logger.warn("MongoDB disconnected"));
    mongoose.connection.on("reconnected", () => logger.info("MongoDB reconnected"));

    await mongoose.connect(envConfig.MONGODB_URI, {
        serverSelectionTimeoutMS: 10_000,
    });

    logger.info(`MongoDB connected (${mongoose.connection.name})`);
}

export async function disconnectDatabase() {
    await mongoose.disconnect();
}
