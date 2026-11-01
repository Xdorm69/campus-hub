export type GlobalRole = "USER" | "ADMIN";

/** The slice of a user embedded in messages, members and replies. */
export interface UserSummary {
  id: string;
  username: string;
  avatarUrl: string | null;
  role: GlobalRole;
}

export interface UserProfile extends UserSummary {
  bio: string | null;
  createdAt: string;
  // Only present when viewing yourself, or as an admin.
  email?: string;
  verified?: boolean;
}

/** `/users/me` always includes the private fields. */
export interface CurrentUser extends UserProfile {
  email: string;
  verified: boolean;
  updatedAt: string;
}

export interface UpdateProfilePayload {
  username?: string;
  bio?: string;
}
