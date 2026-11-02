import { envConfig } from "../config/env.js";
import { messagesRepository } from "../modules/messages/messages.repository.js";
import { removeUploads } from "../utils/files.js";
import { logger } from "../utils/logger.js";

const DAY_MS = 24 * 60 * 60 * 1000;
const RUN_EVERY_MS = 60 * 60 * 1000; // hourly
const BATCH_SIZE = 200;

/**
 * Deletes the audio of voice notes older than VOICE_RETENTION_DAYS. The
 * message itself stays (shown as "voice message expired"); its updatedAt
 * changes, so polling clients pick up the new state on their next sync.
 *
 * Idempotent, so it's safe if several API instances run it at once.
 */
export async function expireOldVoiceNotes(now = new Date()) {
    const cutoff = new Date(now.getTime() - envConfig.VOICE_RETENTION_DAYS * DAY_MS);
    let expired = 0;

    for (;;) {
        const batch = await messagesRepository.findVoiceNotesOlderThan(cutoff, BATCH_SIZE);
        if (batch.length === 0) break;

        await removeUploads(batch.map((message) => message.voiceNote.path));
        await messagesRepository.expireVoiceNotes(batch.map((message) => message._id));
        expired += batch.length;

        if (batch.length < BATCH_SIZE) break;
    }

    if (expired > 0) logger.info({ expired }, "Expired old voice notes");
    return expired;
}

export function startVoiceRetentionJob() {
    const run = () =>
        expireOldVoiceNotes().catch((error) => logger.error({ err: error }, "Voice retention job failed"));

    run();
    // unref: never keep the process alive just for this timer.
    setInterval(run, RUN_EVERY_MS).unref();
}
