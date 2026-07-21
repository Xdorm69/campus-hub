export interface ClassSummary {
  id: string;
  name: string;
  description: string;
  memberCount: number;
  isMember: boolean;
  createdAt: string;
}

export interface ClassDetails extends ClassSummary {
  isModerator: boolean;
}

export type MemberRole = "MEMBER" | "MODERATOR";

export interface ClassMember {
  id: string; // membership id, used for moderation calls
  userId: string; // user id, used for moderation calls
  user: {
    id: string;
    username: string;
    avatarUrl: string | null;
    role: "ADMIN" | "USER";
  };
  role: MemberRole;
  isModerator: boolean;
  muted: boolean;
  banned: boolean;
}

export interface CreateClassPayload {
  name: string;
  description: string;
}

export type UpdateClassPayload = Partial<CreateClassPayload>;

export interface ModerateMemberPayload {
  isMuted?: boolean;
  isBanned?: boolean;
  role?: MemberRole;
}
