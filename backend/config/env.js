import dotenv from "dotenv";

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
    // Public origin of this API (no trailing slash), used to build file URLs.
    PUBLIC_URL: (process.env.PUBLIC_URL || `http://localhost:${PORT}`).replace(/\/+$/, ""),

    // Voice notes are the easiest way to fill the database, so they're capped
    // three ways: per user per day, in total, and by age.
    VOICE_DAILY_LIMIT_MB: Number(process.env.VOICE_DAILY_LIMIT_MB) || 5,
    VOICE_STORAGE_LIMIT_MB: Number(process.env.VOICE_STORAGE_LIMIT_MB) || 200,
    VOICE_RETENTION_DAYS: Number(process.env.VOICE_RETENTION_DAYS) || 30,
};

export const isProduction = envConfig.NODE_ENV === "production";

if (!envConfig.JWT_SECRET) {
    throw new Error("JWT_SECRET is not set. Add it to backend/.env");
}

if (isProduction && !process.env.PUBLIC_URL) {
    // Without it every image/file link points at localhost and breaks.
    console.warn(
        "[config] PUBLIC_URL is not set — uploaded file URLs will use http://localhost. " +
            "Set it to this API's public origin, e.g. https://your-api.onrender.com"
    );
}
