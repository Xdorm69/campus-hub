import { toPublicUrl } from "../../utils/files.js";

/** Minimal user shape embedded in messages, members, replies. */
export function toAuthorDTO(user) {
    if (!user) return null;

    return {
        id: String(user._id),
        username: user.username,
        avatarUrl: toPublicUrl(user.avatarPath),
        role: user.role,
    };
}

/**
 * Full profile. `includePrivate` adds fields only the owner (or an admin)
 * should see.
 */
export function toUserDTO(user, { includePrivate = false } = {}) {
    return {
        ...toAuthorDTO(user),
        bio: user.bio ?? null,
        // An uploaded banner wins; otherwise a preset id; otherwise both null
        // and the client falls back to a color.
        bannerUrl: toPublicUrl(user.bannerPath),
        bannerPreset: user.bannerPath ? null : (user.bannerPreset ?? null),
        createdAt: user.createdAt,
        ...(includePrivate && {
            email: user.email,
            verified: user.verified,
            updatedAt: user.updatedAt,
        }),
    };
}
