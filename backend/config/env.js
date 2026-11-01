import dotenv from "dotenv";
import path from "node:path";

dotenv.config();

const PORT = Number(process.env.PORT) || 4000;

export const envConfig = {
    PORT,
    NODE_ENV: process.env.NODE_ENV || "local",
    MONGODB_URI: process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/campushub",
    JWT_SECRET: process.env.JWT_SECRET,
    JWT_EXPIRES_IN_HOURS: Number(process.env.JWT_EXPIRES_IN_HOURS) || 24 * 7,
    BCRYPT_ROUNDS: Number(process.env.BCRYPT_ROUNDS) || 10,
    LOG_LEVEL: process.env.LOG_LEVEL || "info",
    FRONTEND_URL: process.env.FRONTEND_URL || "http://localhost:3000",
    // Public origin of this API, used to build absolute URLs for uploaded files.
    PUBLIC_URL: process.env.PUBLIC_URL || `http://localhost:${PORT}`,
    UPLOAD_DIR: path.resolve(process.env.UPLOAD_DIR || "uploads"),
};

export const isProduction = envConfig.NODE_ENV === "production";

if (!envConfig.JWT_SECRET) {
    throw new Error("JWT_SECRET is not set. Add it to backend/.env");
}
