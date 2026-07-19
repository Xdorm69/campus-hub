import z from "zod";

export const userProfileUpdateSchema = z.object({
    username: z.string().min(1).max(100).optional(),
    bio: z.string().max(500).optional(),
    avatar: z.string().url().optional()
});
