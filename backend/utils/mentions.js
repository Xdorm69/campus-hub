// Same character set as usernames (see usernameSchema): 3–20 of [A-Za-z0-9_].
// The lookbehind stops matches inside emails and words ("bob@x.edu", "a@b").
const MENTION_PATTERN = /(?<![\w@])@([a-zA-Z0-9_]{3,20})(?![\w])/g;

export const MAX_MENTIONS_PER_MESSAGE = 20;

/** Unique usernames written as @name in `content`, in order of appearance. */
export function extractMentionedUsernames(content) {
    const seen = new Map();
    for (const [, username] of content.matchAll(MENTION_PATTERN)) {
        const key = username.toLowerCase();
        if (!seen.has(key)) seen.set(key, username);
        if (seen.size >= MAX_MENTIONS_PER_MESSAGE) break;
    }
    return [...seen.values()];
}
