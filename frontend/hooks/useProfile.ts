"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { userService } from "@/services/user.service";
import { queryKeys } from "@/lib/query-keys";
import { getErrorMessage } from "@/lib/api-error";
import { CurrentUser, UpdateProfilePayload } from "@/types/user";

/** The signed-in user. Errors (401) mean "not logged in". */
export function useProfile() {
  return useQuery({
    queryKey: queryKeys.me,
    queryFn: userService.getMe,
    retry: false,
    staleTime: 5 * 60 * 1000,
  });
}

/** Any user's public profile, e.g. for the profile popover. */
export function useUserProfile(userId: string | null | undefined, enabled = true) {
  return useQuery({
    queryKey: queryKeys.users.detail(userId ?? ""),
    queryFn: () => userService.getById(userId!),
    enabled: Boolean(userId) && enabled,
    staleTime: 60 * 1000,
  });
}

function useSetCurrentUser() {
  const queryClient = useQueryClient();
  return (user: CurrentUser) => {
    queryClient.setQueryData(queryKeys.me, user);
    queryClient.setQueryData(queryKeys.users.detail(user.id), user);
  };
}

export function useUpdateProfile() {
  const setCurrentUser = useSetCurrentUser();

  return useMutation({
    mutationFn: (payload: UpdateProfilePayload) => userService.updateMe(payload),
    onSuccess: (user) => {
      setCurrentUser(user);
      toast.success("Profile updated");
    },
  });
}

export function useUploadAvatar() {
  const setCurrentUser = useSetCurrentUser();

  return useMutation({
    mutationFn: (file: File) => userService.uploadAvatar(file),
    onSuccess: (user) => {
      setCurrentUser(user);
      toast.success("Avatar updated");
    },
    onError: (error) => toast.error(getErrorMessage(error, "Couldn't upload avatar")),
  });
}

export function useRemoveAvatar() {
  const setCurrentUser = useSetCurrentUser();

  return useMutation({
    mutationFn: () => userService.removeAvatar(),
    onSuccess: (user) => {
      setCurrentUser(user);
      toast.success("Avatar removed");
    },
    onError: (error) => toast.error(getErrorMessage(error, "Couldn't remove avatar")),
  });
}
