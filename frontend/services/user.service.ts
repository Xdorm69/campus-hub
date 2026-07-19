import { api } from "@/lib/axios";
import { ApiResponse } from "@/types/auth";
import { ClassSummary } from "@/types/class";
import { UpdateProfilePayload, User } from "@/types/user";

export const userService = {
  async getMe(): Promise<User> {
    const { data } = await api.get<ApiResponse<User>>("/users/me");
    return data.data;
  },

  async updateMe(payload: UpdateProfilePayload): Promise<User> {
    const { data } = await api.patch<ApiResponse<User>>("/users/me", payload);
    return data.data;
  },

  async getMyClasses(): Promise<ClassSummary[]> {
    const { data } = await api.get<ApiResponse<ClassSummary[]>>("/users/me/classes");
    return data.data;
  },
};
