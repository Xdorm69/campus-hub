import { api } from "@/lib/axios";
import { ApiResponse } from "@/types/api";
import { JoinedClass } from "@/types/class";
import { CurrentUser, UpdateProfilePayload, UserProfile } from "@/types/user";

export const userService = {
  async getMe(): Promise<CurrentUser> {
    const { data } = await api.get<ApiResponse<CurrentUser>>("/users/me");
    return data.data;
  },

  async updateMe(payload: UpdateProfilePayload): Promise<CurrentUser> {
    const { data } = await api.patch<ApiResponse<CurrentUser>>("/users/me", payload);
    return data.data;
  },

  async uploadAvatar(file: File): Promise<CurrentUser> {
    const form = new FormData();
    form.append("avatar", file);
    const { data } = await api.put<ApiResponse<CurrentUser>>("/users/me/avatar", form);
    return data.data;
  },

  async removeAvatar(): Promise<CurrentUser> {
    const { data } = await api.delete<ApiResponse<CurrentUser>>("/users/me/avatar");
    return data.data;
  },

  async getMyClasses(): Promise<JoinedClass[]> {
    const { data } = await api.get<ApiResponse<JoinedClass[]>>("/users/me/classes");
    return data.data;
  },

  async getById(userId: string): Promise<UserProfile> {
    const { data } = await api.get<ApiResponse<UserProfile>>(`/users/${userId}`);
    return data.data;
  },
};
