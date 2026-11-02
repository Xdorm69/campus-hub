import { envConfig } from "../config/env.js";
import { messagesRepository } from "../modules/messages/messages.repository.js";
import { removeUploads } from "../utils/files.js";
import { logger } from "../utils/logger.js";

const DAY_MS = 24 * 60 * 60 * 1000;
const RUN_EVERY_MS = 60 * 60 * 1000; // hourly
const BATCH_SIZE = 200;

/**
 * Pages through `findBatch` until it runs dry, deleting the stored files
 * and marking the messages expired. The messages themselves stay (shown as
 * "expired"); their updatedAt changes, so polling clients pick up the new
 * state on their next sync.
 *
 * Idempotent, so it's safe if several API instances run it at once.
 */
async function expireInBatches({ findBatch, filesOf, markExpired }) {
    let expired = 0;

    for (;;) {
        const batch = await findBatch(BATCH_SIZE);
        if (batch.length === 0) break;

        await removeUploads(batch.flatMap(filesOf));
        await markExpired(batch.map((message) => message._id));
        expired += batch.length;

        if (batch.length < BATCH_SIZE) break;
    }

    return expired;
}

const cutoffFor = (now, days) => new Date(now.getTime() - days * DAY_MS);

/** Deletes the audio of voice notes older than VOICE_RETENTION_DAYS. */
export function expireOldVoiceNotes(now = new Date()) {
    const cutoff = cutoffFor(now, envConfig.VOICE_RETENTION_DAYS);

    return expireInBatches({
        findBatch: (limit) => messagesRepository.findVoiceNotesOlderThan(cutoff, limit),
        filesOf: (message) => [message.voiceNote.path],
        markExpired: messagesRepository.expireVoiceNotes,
    });
}

/** Deletes video attachments older than VIDEO_RETENTION_DAYS. */
export function expireOldVideos(now = new Date()) {
    const cutoff = cutoffFor(now, envConfig.VIDEO_RETENTION_DAYS);

    return expireInBatches({
        findBatch: (limit) => messagesRepository.findVideoMessagesOlderThan(cutoff, limit),
        filesOf: (message) =>
            message.attachments
                .filter((a) => a.mimeType.startsWith("video/") && a.path)
                .map((a) => a.path),
        markExpired: messagesRepository.expireVideoAttachments,
    });
}

export async function runMediaRetention(now = new Date()) {
    const [voiceNotes, videoMessages] = await Promise.all([
        expireOldVoiceNotes(now),
        expireOldVideos(now),
    ]);

    if (voiceNotes > 0 || videoMessages > 0) {
        logger.info({ voiceNotes, videoMessages }, "Expired old media");
    }
    return { voiceNotes, videoMessages };
}

export function startMediaRetentionJob() {
    const run = () =>
        runMediaRetention().catch((error) => logger.error({ err: error }, "Media retention job failed"));

    run();
    // unref: never keep the process alive just for this timer.
    setInterval(run, RUN_EVERY_MS).unref();
}
