"use client";

import Link from "next/link";
import { LogOut, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { UserAvatar } from "@/components/ui/user-avatar";
import { useProfile } from "@/hooks/useProfile";
import { useLogout } from "@/hooks/useAuth";
import { ThemeToggle } from "./ThemeToggle";

/** Discord-style "you" panel pinned to the bottom of the sidebar. */
export function UserPanel() {
  const { data: user } = useProfile();
  const logout = useLogout();

  return (
    <div className="flex items-center gap-1 bg-sidebar-panel px-2 py-1.5">
      <Link
        href="/profile"
        className="flex min-w-0 flex-1 items-center gap-2 rounded-md px-1 py-1 transition-colors hover:bg-sidebar-accent"
      >
        <div className="relative">
          <UserAvatar user={user} className="h-8 w-8" fallbackClassName="text-xs" />
          <span className="absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full border-[3px] border-sidebar-panel bg-success" />
        </div>
        <div className="min-w-0 leading-tight">
          <p className="truncate text-sm font-semibold text-foreground">{user?.username}</p>
          <p className="truncate text-xs text-muted-foreground">
            {user?.role === "ADMIN" ? "Admin" : "Student"}
          </p>
        </div>
      </Link>

      <ThemeToggle />
      <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
        <Link href="/profile" aria-label="User settings" title="User settings">
          <Settings className="h-4 w-4" />
        </Link>
      </Button>
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8 hover:text-destructive"
        onClick={() => logout.mutate()}
        disabled={logout.isPending}
        aria-label="Log out"
        title="Log out"
      >
        <LogOut className="h-4 w-4" />
      </Button>
    </div>
  );
}
