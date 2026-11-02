import { z } from "zod";
import { objectIdSchema } from "../../utils/validators.js";
import { VOICE_LIMITS } from "../../constants/upload.js";
import { GIF_PROVIDERS, GIF_PROVIDER_NAMES } from "../../constants/gifs.js";

export const MESSAGE_MAX_LENGTH = 4000;

const contentSchema = z.string().trim().max(MESSAGE_MAX_LENGTH, `Messages are limited to ${MESSAGE_MAX_LENGTH} characters`);

export const listMessagesQuerySchema = z.object({
    before: objectIdSchema.optional(),
    limit: z.coerce.number().int().min(1).max(100).default(30),
});

export const syncMessagesQuerySchema = z.object({
    since: z.coerce.date({ error: "since must be a valid date" }),
});

/** True for an https URL whose host matches the provider's CDN allowlist. */
function isProviderUrl(value, provider) {
    try {
        const url = new URL(value);
        return url.protocol === "https:" && GIF_PROVIDERS[provider].hosts.test(url.hostname);
    } catch {
        return false;
    }
}

// A GIF picked in the client's GIF picker (sent as JSON, not multipart).
const gifSchema = z
    .object({
        provider: z.enum(GIF_PROVIDER_NAMES),
        providerId: z.string().trim().min(1).max(100),
        title: z.string().trim().max(200).default(""),
        url: z.string().max(2048),
        previewUrl: z.string().max(2048).nullable().default(null),
        width: z.number().int().min(1).max(4096),
        height: z.number().int().min(1).max(4096),
    })
    .superRefine((gif, ctx) => {
        for (const field of ["url", "previewUrl"]) {
            if (gif[field] !== null && !isProviderUrl(gif[field], gif.provider)) {
                ctx.addIssue({
                    code: "custom",
                    path: [field],
                    message: `GIF media must come from ${gif.provider}'s CDN`,
                });
            }
        }
    });

// Usually multipart/form-data (every field a string); GIF messages are JSON.
export const sendMessageSchema = z.object({
    content: contentSchema.default(""),
    replyTo: objectIdSchema.optional().or(z.literal("").transform(() => undefined)),
    gif: gifSchema.optional(),
    // Length of the attached `voice` recording, as measured by the recorder.
    voiceDurationMs: z.coerce
        .number()
        .int()
        .min(0)
        // Small allowance for recorder timing jitter.
        .max(VOICE_LIMITS.MAX_DURATION_MS + 2_000, "Voice messages are limited to 2 minutes")
        .optional(),
});

export const editMessageSchema = z.object({
    content: contentSchema,
});

export const reactionSchema = z.object({
    emoji: z
        .string()
        .trim()
        .min(1)
        .max(16)
        .regex(/\p{Extended_Pictographic}/u, "Reaction must be an emoji"),
});
