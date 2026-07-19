import { api } from "@/lib/axios";
import { ApiResponse } from "@/types/auth";
import {
  ClassDetails,
  ClassMember,
  ClassSummary,
  ModerateMemberPayload,
} from "@/types/class";

export const classService = {
  async getAll(): Promise<ClassSummary[]> {
    const { data } = await api.get<ApiResponse<ClassSummary[]>>("/classes");
    return data.data;
  },

  async getById(classId: string): Promise<ClassDetails> {
    const { data } = await api.get<ApiResponse<ClassDetails>>(`/classes/${classId}`);
    return data.data;
  },

  async join(classId: string): Promise<void> {
    await api.post(`/classes/${classId}/join`);
  },

  async leave(classId: string): Promise<void> {
    await api.post(`/classes/${classId}/leave`);
  },

  async getMembers(classId: string): Promise<ClassMember[]> {
    const { data } = await api.get<ApiResponse<ClassMember[]>>(`/classes/${classId}/members`);
    return data.data;
  },

  async moderateMember(
    classId: string,
    memberId: string,
    payload: ModerateMemberPayload
  ): Promise<ClassMember> {
    const { data } = await api.patch<ApiResponse<ClassMember>>(
      `/classes/${classId}/members/${memberId}`,
      payload
    );
    return data.data;
  },

  async removeMember(classId: string, memberId: string): Promise<void> {
    await api.delete<ApiResponse<void>>(`/classes/${classId}/members/${memberId}`);
  },
};
