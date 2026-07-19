"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { userService } from "@/services/user.service";
import { UpdateProfilePayload } from "@/types/user";

export function useProfile() {
  return useQuery({
    queryKey: ["me"],
    queryFn: userService.getMe,
    retry: false,
  });
};

export function useMyClasses() {
  return useQuery({
    queryKey: ["me", "classes"],
    queryFn: userService.getMyClasses,
  });
}


export function useUpdateProfile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: UpdateProfilePayload) => userService.updateMe(payload),
    onSuccess: (updatedUser) => {
      queryClient.setQueryData(["me"], updatedUser);
    },
  });
}
