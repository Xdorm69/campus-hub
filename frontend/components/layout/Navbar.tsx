"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { GraduationCap, LogOut, User as UserIcon } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useProfile } from "@/hooks/useProfile";
import { useLogout } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";
import { ThemeToggle } from "./ThemeToggle";

export function Navbar() {
  const { data: user } = useProfile();
  const logout = useLogout();
  const pathname = usePathname();

  const initials = user?.username?.slice(0, 2).toUpperCase() ?? "";

  return (
    <header className="sticky top-0 z-10 border-b border-border bg-background/95 backdrop-blur">
      <div className="container flex h-16 items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <GraduationCap className="h-6 w-6 text-primary" />
          <span className="font-serif text-lg font-semibold">CampusHub</span>
        </Link>

        <nav className="flex items-center gap-1">
          <Link
            href="/profile"
            className={cn(
              "flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-secondary",
              pathname === "/profile" && "bg-secondary"
            )}
          >
            <Avatar className="h-6 w-6">
              <AvatarImage src={user?.avatarUrl ?? undefined} alt={user?.username} />
              <AvatarFallback className="text-[10px]">
                {initials || <UserIcon className="h-3 w-3" />}
              </AvatarFallback>
            </Avatar>
            Profile
          </Link>

          <ThemeToggle/>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => logout.mutate()}
            aria-label="Log out"
            title="Log out"
          >
            <LogOut className="h-4 w-4" />
          </Button>
        </nav>
      </div>
    </header>
  );
}
