export interface ClassSummary {
  id: string;
  name: string;
  description: string;
  memberCount: number;
  isMember: boolean;
  createdAt: string;
}

export interface ClassDetails extends ClassSummary {
  moderator: boolean;
}

export type MemberRole = "MEMBER" | "MODERATOR";

export interface ClassMember {
  id: string; // membership id, used for moderation calls
  user: {
    id: string;
    username: string;
    avatarUrl: string | null;
  };
  role: MemberRole;
  isMuted: boolean;
  isBanned: boolean;
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
