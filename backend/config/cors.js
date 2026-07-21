import { envConfig } from "./env.js";

export const corsConfig = {
    
    origin: envConfig.FRONTEND_URL,
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],

}