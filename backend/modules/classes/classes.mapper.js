/**
 * Class as seen by a specific user: the class itself plus that user's
 * relationship to it (membership flags, moderation rights, unread count).
 */
export function toClassDTO(classDoc, { memberCount = 0, membership = null, isAdmin = false, unreadCount } = {}) {
    const isBanned = Boolean(membership?.banned);
    const isMember = Boolean(membership) && !isBanned;
    const isModerator = isMember && Boolean(membership.isModerator);

    return {
        id: String(classDoc._id),
        code: classDoc.code,
        name: classDoc.name,
        description: classDoc.description ?? "",
        memberCount,
        lastMessageAt: classDoc.lastMessageAt ?? null,
        createdAt: classDoc.createdAt,
        isMember,
        isModerator,
        isMuted: isMember && Boolean(membership.muted),
        isBanned,
        canModerate: isAdmin || isModerator,
        ...(unreadCount !== undefined && { unreadCount }),
    };
}
