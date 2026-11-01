import { api } from "@/lib/axios";
import { ApiResponse } from "@/types/api";
import { AuthResponse, LoginPayload, RegisterPayload } from "@/types/auth";

export const authService = {
  async login(payload: LoginPayload): Promise<AuthResponse> {
    const { data } = await api.post<ApiResponse<AuthResponse>>("/auth/login", payload);
    return data.data;
  },

  async register(payload: RegisterPayload): Promise<AuthResponse> {
    const { data } = await api.post<ApiResponse<AuthResponse>>("/auth/register", payload);
    return data.data;
  },

  async logout(): Promise<void> {
    await api.post("/auth/logout");
  },
};
