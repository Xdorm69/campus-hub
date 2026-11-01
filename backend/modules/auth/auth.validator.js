import { z } from "zod";
import { usernameSchema } from "../../utils/validators.js";

const emailSchema = z.email("Enter a valid email").trim().toLowerCase();

const passwordSchema = z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(64, "Password must be 64 characters or fewer");

export const registerSchema = z.object({
    username: usernameSchema,
    email: emailSchema,
    password: passwordSchema,
});

export const loginSchema = z.object({
    email: emailSchema,
    password: z.string().min(1, "Password is required").max(64),
});
