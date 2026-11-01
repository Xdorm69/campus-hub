"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { classService } from "@/services/class.service";
import { userService } from "@/services/user.service";
import { queryKeys } from "@/lib/query-keys";
import { POLL_INTERVALS } from "@/lib/constants";
import { getErrorMessage } from "@/lib/api-error";
import {
  ClassRoom,
  CreateClassPayload,
  JoinedClass,
  UpdateClassPayload,
} from "@/types/class";

/* ---------------------------------- Queries --------------------------------- */

export function useClasses(search = "") {
  return useQuery({
    queryKey: queryKeys.classes.list(search),
    queryFn: () => classService.getAll(search),
    placeholderData: (previous) => previous, // keep results on screen while typing
  });
}

export function useClass(classId: string) {
  return useQuery({
    queryKey: queryKeys.classes.detail(classId),
    queryFn: () => classService.getById(classId),
    enabled: Boolean(classId),
    // Picks up being muted/banned/promoted without a reload.
    refetchInterval: POLL_INTERVALS.CLASS_DETAILS,
  });
}

/** Sidebar list with unread counts, polled so badges stay current. */
export function useMyClasses() {
  return useQuery({
    queryKey: queryKeys.myClasses,
    queryFn: userService.getMyClasses,
    refetchInterval: POLL_INTERVALS.MY_CLASSES,
  });
}

/* --------------------------------- Mutations -------------------------------- */

/** Patches a class everywhere it's cached (browse lists + detail). */
function usePatchCachedClass() {
  const queryClient = useQueryClient();

  return (classId: string, patch: (classRoom: ClassRoom) => ClassRoom) => {
    queryClient.setQueriesData<ClassRoom[]>({ queryKey: queryKeys.classes.lists() }, (old) =>
      old?.map((c) => (c.id === classId ? patch(c) : c))
    );
    queryClient.setQueryData<ClassRoom>(queryKeys.classes.detail(classId), (old) =>
      old ? patch(old) : old
    );
  };
}

function useInvalidateClass() {
  const queryClient = useQueryClient();

  return (classId: string) =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: queryKeys.classes.all }),
      queryClient.invalidateQueries({ queryKey: queryKeys.myClasses }),
      queryClient.invalidateQueries({ queryKey: queryKeys.classes.members(classId) }),
    ]);
}

/**
 * Join/leave share the same optimistic flow: flip membership immediately,
 * roll back on failure, then reconcile with the server.
 */
function useMembershipMutation(classId: string, action: "join" | "leave") {
  const queryClient = useQueryClient();
  const patchCachedClass = usePatchCachedClass();
  const invalidateClass = useInvalidateClass();
  const joining = action === "join";

  return useMutation({
    mutationFn: () => (joining ? classService.join(classId) : classService.leave(classId)),
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: queryKeys.classes.all });

      const snapshot = queryClient.getQueriesData<ClassRoom | ClassRoom[]>({
        queryKey: queryKeys.classes.all,
      });

      patchCachedClass(classId, (c) => ({
        ...c,
        isMember: joining,
        memberCount: Math.max(0, c.memberCount + (joining ? 1 : -1)),
      }));

      return { snapshot };
    },
    onError: (error, _vars, context) => {
      context?.snapshot.forEach(([key, data]) => queryClient.setQueryData(key, data));
      toast.error(getErrorMessage(error, `Couldn't ${action} class`));
    },
    onSuccess: () => {
      if (joining) {
        // A previous 403 may be cached for this room's history.
        queryClient.resetQueries({ queryKey: queryKeys.messages.list(classId) });
      } else {
        queryClient.removeQueries({ queryKey: ["messages", classId] });
      }
    },
    onSettled: () => invalidateClass(classId),
  });
}

export function useJoinClass(classId: string) {
  return useMembershipMutation(classId, "join");
}

export function useLeaveClass(classId: string) {
  return useMembershipMutation(classId, "leave");
}

export function useCreateClass() {
  const queryClient = useQueryClient();
  const router = useRouter();

  return useMutation({
    mutationFn: (payload: CreateClassPayload) => classService.create(payload),
    onSuccess: (created) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.classes.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.myClasses });
      toast.success(`#${created.name} created`);
      router.push(`/classes/${created.id}`);
    },
  });
}

export function useUpdateClass(classId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: UpdateClassPayload) => classService.update(classId, payload),
    onSuccess: (updated) => {
      queryClient.setQueryData(queryKeys.classes.detail(classId), updated);
      queryClient.invalidateQueries({ queryKey: queryKeys.classes.lists() });
      queryClient.invalidateQueries({ queryKey: queryKeys.myClasses });
      toast.success("Class updated");
    },
  });
}

export function useDeleteClass(classId: string) {
  const queryClient = useQueryClient();
  const router = useRouter();

  return useMutation({
    mutationFn: () => classService.remove(classId),
    onSuccess: () => {
      router.replace("/classes");
      queryClient.removeQueries({ queryKey: queryKeys.classes.detail(classId) });
      queryClient.removeQueries({ queryKey: ["messages", classId] });
      queryClient.invalidateQueries({ queryKey: queryKeys.classes.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.myClasses });
      toast.success("Class deleted");
    },
    onError: (error) => toast.error(getErrorMessage(error, "Couldn't delete class")),
  });
}

/** Clears the unread badge locally right away, then tells the server. */
export function useMarkClassRead(classId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => classService.markRead(classId),
    onMutate: () => {
      queryClient.setQueryData<JoinedClass[]>(queryKeys.myClasses, (old) =>
        old?.map((c) => (c.id === classId ? { ...c, unreadCount: 0 } : c))
      );
    },
  });
}
