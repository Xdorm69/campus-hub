import { envConfig } from "../../config/env.js";
import { UPLOAD_FOLDERS, VOICE_LIMITS } from "../../constants/upload.js";
import ApiError from "../../utils/ApiError.js";
import { getFolderUsage } from "../../utils/files.js";
import { messagesRepository } from "./messages.repository.js";

const MB = 1024 * 1024;
const DAY_MS = 24 * 60 * 60 * 1000;

const mb = (bytes) => `${(bytes / MB).toFixed(1)} MB`;

/**
 * Guards against voice notes filling the database. Checked before anything
 * is written, in order of cheapest first:
 *
 *  1. per note   — size cap (duration is capped by the recorder + validator)
 *  2. per user   — VOICE_DAILY_LIMIT_MB in any rolling 24 hours
 *  3. app-wide   — VOICE_STORAGE_LIMIT_MB across all stored voice notes
 *
 * The retention job (jobs/voice-retention.job.js) frees space over time, so
 * the app-wide cap is a ceiling, not a permanent wall.
 *
 * Concurrent sends can overshoot a limit by at most one note each, which is
 * fine for a storage guard.
 */
export async function assertVoiceNoteAllowed(userId, sizeBytes) {
    if (sizeBytes > VOICE_LIMITS.MAX_SIZE) {
        throw new ApiError(413, "VoiceNoteTooLarge", `Voice messages are limited to ${mb(VOICE_LIMITS.MAX_SIZE)}`);
    }

    const dailyLimit = envConfig.VOICE_DAILY_LIMIT_MB * MB;
    const { bytes: usedToday } = await messagesRepository.voiceUsageByAuthorSince(
        userId,
        new Date(Date.now() - DAY_MS)
    );
    if (usedToday + sizeBytes > dailyLimit) {
        throw new ApiError(
            429,
            "VoiceQuotaExceeded",
            `You've used your voice message allowance for today (${mb(dailyLimit)} per 24 hours). Try again later.`
        );
    }

    const storageLimit = envConfig.VOICE_STORAGE_LIMIT_MB * MB;
    const storedTotal = await getFolderUsage(UPLOAD_FOLDERS.VOICE);
    if (storedTotal + sizeBytes > storageLimit) {
        throw new ApiError(
            507,
            "VoiceStorageFull",
            "Voice message storage is full right now. Older voice messages expire automatically — try again later."
        );
    }
}
