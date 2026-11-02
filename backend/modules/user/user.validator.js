import { z } from "zod";
import { usernameSchema } from "../../utils/validators.js";
import { BANNER_PRESET_IDS } from "../../constants/banners.js";

export const userProfileUpdateSchema = z
    .object({
        username: usernameSchema.optional(),
        bio: z.string().trim().max(280, "Bio must be 280 characters or fewer").optional(),
        // Pick a built-in banner (replaces any uploaded one), or null for none.
        bannerPreset: z.enum(BANNER_PRESET_IDS).nullable().optional(),
    })
    .refine(
        (data) => data.username !== undefined || data.bio !== undefined || data.bannerPreset !== undefined,
        { message: "Provide at least one field to update." }
    );
