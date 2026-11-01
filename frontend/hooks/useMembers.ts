"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { classService } from "@/services/class.service";
import { queryKeys } from "@/lib/query-keys";
import { POLL_INTERVALS } from "@/lib/constants";
import { getErrorMessage } from "@/lib/api-error";
import { ClassMember, ModerateMemberPayload } from "@/types/class";

export function useMembers(classId: string, enabled = true) {
  return useQuery({
    queryKey: queryKeys.classes.members(classId),
    queryFn: () => classService.getMembers(classId),
    enabled: Boolean(classId) && enabled,
    refetchInterval: POLL_INTERVALS.MEMBERS,
  });
}

export function useModerateMember(classId: string) {
  const queryClient = useQueryClient();
  const membersKey = queryKeys.classes.members(classId);

  return useMutation({
    mutationFn: ({ userId, payload }: { userId: string; payload: ModerateMemberPayload }) =>
      classService.moderateMember(classId, userId, payload),
    onSuccess: (updated) => {
      queryClient.setQueryData<ClassMember[]>(membersKey, (old) =>
        old?.map((member) => (member.id === updated.id ? updated : member))
      );
      // Banning changes the active member count.
      queryClient.invalidateQueries({ queryKey: queryKeys.classes.detail(classId) });
    },
    onError: (error) => toast.error(getErrorMessage(error, "Couldn't update member")),
  });
}

export function useRemoveMember(classId: string) {
  const queryClient = useQueryClient();
  const membersKey = queryKeys.classes.members(classId);

  return useMutation({
    mutationFn: (userId: string) => classService.removeMember(classId, userId),
    onSuccess: (_data, userId) => {
      queryClient.setQueryData<ClassMember[]>(membersKey, (old) =>
        old?.filter((member) => member.userId !== userId)
      );
      queryClient.invalidateQueries({ queryKey: queryKeys.classes.detail(classId) });
      toast.success("Member removed");
    },
    onError: (error) => toast.error(getErrorMessage(error, "Couldn't remove member")),
  });
}
