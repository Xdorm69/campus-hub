import { rateLimit } from "express-rate-limit";

const rateLimitHandler = (message) => (req, res) => {
    res.status(429).json({
        success: false,
        type: "RateLimit",
        message,
    });
};

export const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    limit: 10,
    standardHeaders: true,
    legacyHeaders: false,
    handler: rateLimitHandler("Too many login attempts. Try again later."),
});

// Chat rooms poll every few seconds, so this has to leave room for a couple
// of open tabs on top of normal browsing.
export const apiLimiter = rateLimit({
    windowMs: 60 * 1000, // 1 minute
    limit: 300,
    standardHeaders: true,
    legacyHeaders: false,
    handler: rateLimitHandler("Too many requests."),
});
