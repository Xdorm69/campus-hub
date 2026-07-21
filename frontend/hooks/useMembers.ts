"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { classService } from "@/services/class.service";
import { ClassMember, ModerateMemberPayload } from "@/types/class";
import { toast } from "sonner";

export function useMembers(classId: string) {
  return useQuery({
    queryKey: ["classes", classId, "members"],
    queryFn: () => classService.getMembers(classId),
    enabled: Boolean(classId),
  });
}

export function useModerateMember(classId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      memberId,
      payload,
    }: {
      memberId: string;
      payload: ModerateMemberPayload;
    }) => classService.moderateMember(classId, memberId, payload),
    onSuccess: (updatedMember) => {
      queryClient.setQueryData<ClassMember[]>(
        ["classes", classId, "members"],
        (old) => old?.map((m) => (m.id === updatedMember.id ? updatedMember : m))
      );
    },
    onError: (error) => {
      console.error("Failed to moderate member:", error);
      toast.error("Failed to moderate member: " + (error as Error).message);
    },
  });
}

export function useRemoveMember(classId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (memberId: string) => classService.removeMember(classId, memberId),
    onSuccess: (_data, memberId) => {
      queryClient.setQueryData<ClassMember[]>(
        ["classes", classId, "members"],
        (old) => old?.filter((m) => m.id !== memberId)
      );
      queryClient.invalidateQueries({ queryKey: ["classes", classId] });
    },
  });
}
