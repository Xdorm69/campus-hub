import { UserSummary } from "./user";

/** A class as seen by the current user. */
export interface ClassRoom {
  id: string;
  code: string;
  name: string;
  description: string;
  memberCount: number;
  lastMessageAt: string | null;
  createdAt: string;
  isMember: boolean;
  isModerator: boolean;
  isMuted: boolean;
  isBanned: boolean;
  /** Moderator of this class, or a global admin. */
  canModerate: boolean;
}

/** Sidebar entry from `/users/me/classes`. */
export interface JoinedClass extends ClassRoom {
  unreadCount: number;
  /** Unread messages that @mention you. */
  mentionCount: number;
}

export type MemberRole = "MEMBER" | "MODERATOR";

export interface ClassMember {
  /** Membership id. */
  id: string;
  /** User id; moderation endpoints are addressed by this. */
  userId: string;
  user: UserSummary & { bio: string | null };
  isModerator: boolean;
  muted: boolean;
  banned: boolean;
  joinedAt: string;
}

export interface CreateClassPayload {
  code: string;
  name: string;
  description?: string;
}

export interface UpdateClassPayload {
  name?: string;
  description?: string;
}

export interface ModerateMemberPayload {
  isMuted?: boolean;
  isBanned?: boolean;
  role?: MemberRole;
}
