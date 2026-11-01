import { z } from "zod";
import { usernameSchema } from "../../utils/validators.js";

export const userProfileUpdateSchema = z
    .object({
        username: usernameSchema.optional(),
        bio: z.string().trim().max(280, "Bio must be 280 characters or fewer").optional(),
    })
    .refine((data) => data.username !== undefined || data.bio !== undefined, {
        message: "Provide at least one field to update.",
    });
