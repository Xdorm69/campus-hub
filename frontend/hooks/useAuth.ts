"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter, useSearchParams } from "next/navigation";
import { authService } from "@/services/auth.service";
import { queryKeys } from "@/lib/query-keys";
import { AuthResponse, LoginPayload, RegisterPayload } from "@/types/auth";

/** Only follow same-origin relative paths from ?from=, never full URLs. */
function useRedirectTarget() {
  const searchParams = useSearchParams();
  const from = searchParams.get("from");
  return from && from.startsWith("/") && !from.startsWith("//") ? from : "/";
}

function useOnAuthenticated() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const redirectTo = useRedirectTarget();

  return ({ user }: AuthResponse) => {
    queryClient.setQueryData(queryKeys.me, user);
    router.replace(redirectTo);
  };
}

export function useLogin() {
  const onAuthenticated = useOnAuthenticated();

  return useMutation({
    mutationFn: (payload: LoginPayload) => authService.login(payload),
    onSuccess: onAuthenticated,
  });
}

export function useRegister() {
  const onAuthenticated = useOnAuthenticated();

  return useMutation({
    mutationFn: (payload: RegisterPayload) => authService.register(payload),
    onSuccess: onAuthenticated,
  });
}

export function useLogout() {
  const router = useRouter();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => authService.logout(),
    onSettled: () => {
      queryClient.clear();
      router.replace("/login");
    },
  });
}
