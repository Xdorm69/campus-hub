"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { GraduationCap, Loader2 } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { useProfile } from "@/hooks/useProfile";

function FullScreenLoader() {
  return (
    <div className="flex h-dvh flex-col items-center justify-center gap-4 bg-sidebar-panel">
      <GraduationCap className="h-12 w-12 animate-pulse text-primary" />
      <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
    </div>
  );
}

/** Client-side auth guard (the JWT cookie is httpOnly on the API origin). */
export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { data: user, isLoading, isError } = useProfile();

  useEffect(() => {
    if (isError) router.replace(`/login?from=${encodeURIComponent(pathname)}`);
  }, [isError, router, pathname]);

  if (isLoading || !user) return <FullScreenLoader />;

  return <AppShell>{children}</AppShell>;
}
