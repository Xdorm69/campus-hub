"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { classService } from "@/services/class.service";
import { ClassDetails, ClassSummary } from "@/types/class";

export function useClasses() {
  return useQuery({
    queryKey: ["classes"],
    queryFn: classService.getAll,
  });
}

export function useClass(classId: string) {
  return useQuery({
    queryKey: ["classes", classId],
    queryFn: () => classService.getById(classId),
    enabled: Boolean(classId),
  });
}

export function useJoinClass(classId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => classService.join(classId),
    // Optimistic update so the button flips instantly instead of waiting
    // on a round trip.
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: ["classes"] });
      await queryClient.cancelQueries({ queryKey: ["classes", classId] });

      const previousList = queryClient.getQueryData<ClassSummary[]>(["classes"]);
      const previousDetails = queryClient.getQueryData<ClassDetails>([
        "classes",
        classId,
      ]);

      queryClient.setQueryData<ClassSummary[]>(["classes"], (old) =>
        old?.map((c) =>
          c.id === classId
            ? { ...c, isMember: true, memberCount: c.memberCount + 1 }
            : c
        )
      );
      queryClient.setQueryData<ClassDetails>(["classes", classId], (old) =>
        old ? { ...old, isMember: true, memberCount: old.memberCount + 1 } : old
      );

      return { previousList, previousDetails };
    },
    onError: (_err, _vars, context) => {
      if (context?.previousList) {
        queryClient.setQueryData(["classes"], context.previousList);
      }
      if (context?.previousDetails) {
        queryClient.setQueryData(["classes", classId], context.previousDetails);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["classes"] });
      queryClient.invalidateQueries({ queryKey: ["classes", classId] });
      queryClient.invalidateQueries({ queryKey: ["classes", classId, "members"] });
    },
  });
}

export function useLeaveClass(classId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => classService.leave(classId),
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: ["classes"] });
      await queryClient.cancelQueries({ queryKey: ["classes", classId] });

      const previousList = queryClient.getQueryData<ClassSummary[]>(["classes"]);
      const previousDetails = queryClient.getQueryData<ClassDetails>([
        "classes",
        classId,
      ]);

      queryClient.setQueryData<ClassSummary[]>(["classes"], (old) =>
        old?.map((c) =>
          c.id === classId
            ? { ...c, isMember: false, memberCount: Math.max(0, c.memberCount - 1) }
            : c
        )
      );
      queryClient.setQueryData<ClassDetails>(["classes", classId], (old) =>
        old
          ? { ...old, isMember: false, memberCount: Math.max(0, old.memberCount - 1) }
          : old
      );

      return { previousList, previousDetails };
    },
    onError: (_err, _vars, context) => {
      if (context?.previousList) {
        queryClient.setQueryData(["classes"], context.previousList);
      }
      if (context?.previousDetails) {
        queryClient.setQueryData(["classes", classId], context.previousDetails);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["classes"] });
      queryClient.invalidateQueries({ queryKey: ["classes", classId] });
      queryClient.invalidateQueries({ queryKey: ["classes", classId, "members"] });
    },
  });
}
