import { z } from "zod";
import { objectIdSchema } from "../../utils/validators.js";
import { VOICE_LIMITS } from "../../constants/upload.js";

export const MESSAGE_MAX_LENGTH = 4000;

const contentSchema = z.string().trim().max(MESSAGE_MAX_LENGTH, `Messages are limited to ${MESSAGE_MAX_LENGTH} characters`);

export const listMessagesQuerySchema = z.object({
    before: objectIdSchema.optional(),
    limit: z.coerce.number().int().min(1).max(100).default(30),
});

export const syncMessagesQuerySchema = z.object({
    since: z.coerce.date({ error: "since must be a valid date" }),
});

// Sent as multipart/form-data, so every field arrives as a string.
export const sendMessageSchema = z.object({
    content: contentSchema.default(""),
    replyTo: objectIdSchema.optional().or(z.literal("").transform(() => undefined)),
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
