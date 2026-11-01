import { z } from "zod";

export const profileSchema = z.object({
  username: z
    .string()
    .trim()
    .min(3, "Username must be at least 3 characters")
    .max(20, "Username must be 20 characters or fewer")
    .regex(/^[a-zA-Z0-9_]+$/, "Only letters, numbers, and underscores"),
  bio: z.string().trim().max(280, "Bio must be 280 characters or fewer"),
});

export type ProfileFormValues = z.infer<typeof profileSchema>;
