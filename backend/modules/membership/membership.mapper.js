import { toAuthorDTO } from "../user/user.mapper.js";

export function toMemberDTO(membership) {
    const user = membership.user;

    return {
        id: String(membership._id),
        userId: String(user?._id ?? membership.user),
        user: user ? { ...toAuthorDTO(user), bio: user.bio ?? null } : null,
        isModerator: membership.isModerator,
        muted: membership.muted,
        banned: membership.banned,
        joinedAt: membership.createdAt,
    };
}
