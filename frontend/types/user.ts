export type GlobalRole = "USER" | "ADMIN";

export interface User {
  id: string;
  username: string;
  email: string;
  bio: string | null;
  avatarUrl: string | null;
  role: GlobalRole;
  createdAt: string;
}

export interface UpdateProfilePayload {
  username?: string;
  bio?: string;
  avatarUrl?: string;
}
