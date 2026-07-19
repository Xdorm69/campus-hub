import dotenv from "dotenv";

dotenv.config();

export const envConfig = {
    PORT: process.env.PORT || 3000,
    NODE_ENV: process.env.NODE_ENV || 'local',
    DATABASE_URL: process.env.DATABASE_URL,
    JWT_SECRET: process.env.JWT_SECRET,
    LOG_LEVEL: process.env.LOG_LEVEL || 'info',
    FRONTEND_URL: process.env.FRONTEND_URL || "http://localhost:3001"
}
