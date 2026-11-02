import { envConfig } from "../../config/env.js";
import { UPLOAD_FOLDERS, VIDEO_LIMITS, VOICE_LIMITS } from "../../constants/upload.js";
import ApiError from "../../utils/ApiError.js";
import { getFolderUsage } from "../../utils/files.js";
import { messagesRepository } from "./messages.repository.js";

const MB = 1024 * 1024;
const DAY_MS = 24 * 60 * 60 * 1000;

const mb = (bytes) => `${(bytes / MB).toFixed(1)} MB`;

/**
 * Storage policies for the media types that can fill the database. Each is
 * capped three ways, checked before anything is written:
 *
 *  1. per item  — size cap
 *  2. per user  — `dailyLimitMb` in any rolling 24 hours
 *  3. app-wide  — `storageLimitMb` across everything stored in `folder`
 *
 * The retention job (jobs/media-retention.job.js) frees space over time, so
 * the app-wide cap is a ceiling, not a permanent wall. Concurrent sends can
 * overshoot a limit by at most one item each, which is fine for a storage guard.
 */
const POLICIES = {
    voice: {
        label: "voice message",
        errorPrefix: "Voice",
        folder: UPLOAD_FOLDERS.VOICE,
        maxItemBytes: VOICE_LIMITS.MAX_SIZE,
        tooLargeType: "VoiceNoteTooLarge",
        dailyLimitMb: () => envConfig.VOICE_DAILY_LIMIT_MB,
        storageLimitMb: () => envConfig.VOICE_STORAGE_LIMIT_MB,
        usageSince: messagesRepository.voiceUsageByAuthorSince,
    },
    video: {
        label: "video",
        errorPrefix: "Video",
        folder: UPLOAD_FOLDERS.VIDEO,
        maxItemBytes: VIDEO_LIMITS.MAX_SIZE,
        tooLargeType: "VideoTooLarge",
        dailyLimitMb: () => envConfig.VIDEO_DAILY_LIMIT_MB,
        storageLimitMb: () => envConfig.VIDEO_STORAGE_LIMIT_MB,
        usageSince: messagesRepository.videoUsageByAuthorSince,
    },
};

/**
 * Throws if storing `itemSizes` (bytes, one entry per file) of media `kind`
 * for `userId` would break any limit.
 */
export async function assertMediaAllowed(kind, userId, itemSizes) {
    if (itemSizes.length === 0) return;
    const policy = POLICIES[kind];

    if (itemSizes.some((size) => size > policy.maxItemBytes)) {
        throw new ApiError(
            413,
            policy.tooLargeType,
            `Each ${policy.label} is limited to ${mb(policy.maxItemBytes)}`
        );
    }

    const incoming = itemSizes.reduce((sum, size) => sum + size, 0);

    const dailyLimit = policy.dailyLimitMb() * MB;
    const { bytes: usedToday } = await policy.usageSince(userId, new Date(Date.now() - DAY_MS));
    if (usedToday + incoming > dailyLimit) {
        throw new ApiError(
            429,
            `${policy.errorPrefix}QuotaExceeded`,
            `You've used your ${policy.label} allowance for today (${mb(dailyLimit)} per 24 hours). Try again later.`
        );
    }

    const storageLimit = policy.storageLimitMb() * MB;
    const storedTotal = await getFolderUsage(policy.folder);
    if (storedTotal + incoming > storageLimit) {
        throw new ApiError(
            507,
            `${policy.errorPrefix}StorageFull`,
            `${policy.errorPrefix} storage is full right now. Older ${policy.label}s expire automatically — try again later.`
        );
    }
}
