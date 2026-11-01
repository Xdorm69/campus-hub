import { api } from "@/lib/axios";
import { ApiResponse } from "@/types/api";
import {
  ClassMember,
  ClassRoom,
  CreateClassPayload,
  ModerateMemberPayload,
  UpdateClassPayload,
} from "@/types/class";

export const classService = {
  async getAll(search?: string): Promise<ClassRoom[]> {
    const { data } = await api.get<ApiResponse<ClassRoom[]>>("/classes", {
      params: { search: search || undefined },
    });
    return data.data;
  },

  async getById(classId: string): Promise<ClassRoom> {
    const { data } = await api.get<ApiResponse<ClassRoom>>(`/classes/${classId}`);
    return data.data;
  },

  async create(payload: CreateClassPayload): Promise<ClassRoom> {
    const { data } = await api.post<ApiResponse<ClassRoom>>("/classes", payload);
    return data.data;
  },

  async update(classId: string, payload: UpdateClassPayload): Promise<ClassRoom> {
    const { data } = await api.patch<ApiResponse<ClassRoom>>(`/classes/${classId}`, payload);
    return data.data;
  },

  async remove(classId: string): Promise<void> {
    await api.delete(`/classes/${classId}`);
  },

  async join(classId: string): Promise<void> {
    await api.post(`/classes/${classId}/join`);
  },

  async leave(classId: string): Promise<void> {
    await api.post(`/classes/${classId}/leave`);
  },

  async markRead(classId: string): Promise<void> {
    await api.post(`/classes/${classId}/read`);
  },

  async getMembers(classId: string): Promise<ClassMember[]> {
    const { data } = await api.get<ApiResponse<ClassMember[]>>(`/classes/${classId}/members`);
    return data.data;
  },

  async moderateMember(
    classId: string,
    userId: string,
    payload: ModerateMemberPayload
  ): Promise<ClassMember> {
    const { data } = await api.patch<ApiResponse<ClassMember>>(
      `/classes/${classId}/members/${userId}`,
      payload
    );
    return data.data;
  },

  async removeMember(classId: string, userId: string): Promise<void> {
    await api.delete(`/classes/${classId}/members/${userId}`);
  },
};
