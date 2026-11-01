"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Ban, Compass, GraduationCap, Hash, Home, MicOff, Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CountBadge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { CreateClassDialog } from "@/features/classes/CreateClassDialog";
import { useMyClasses } from "@/hooks/useClasses";
import { useProfile } from "@/hooks/useProfile";
import { cn } from "@/lib/utils";
import { JoinedClass } from "@/types/class";
import { useSidebar } from "./sidebar-context";
import { UserPanel } from "./UserPanel";

function NavLink({
  href,
  icon: Icon,
  children,
}: {
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isActive = pathname === href;

  return (
    <Link
      href={href}
      className={cn(
        "flex items-center gap-3 rounded-md px-2 py-1.5 text-[15px] font-medium transition-colors",
        isActive
          ? "bg-sidebar-accent text-sidebar-accent-foreground"
          : "text-sidebar-foreground hover:bg-sidebar-accent/60 hover:text-foreground"
      )}
    >
      <Icon className="h-5 w-5" />
      {children}
    </Link>
  );
}

function ChannelLink({ classRoom }: { classRoom: JoinedClass }) {
  const pathname = usePathname();
  const href = `/classes/${classRoom.id}`;
  const isActive = pathname === href;
  const isUnread = classRoom.unreadCount > 0 && !isActive;

  return (
    <Link
      href={href}
      className={cn(
        "group relative flex items-center gap-1.5 rounded-md px-2 py-1.5 text-[15px] transition-colors",
        isActive
          ? "bg-sidebar-accent text-sidebar-accent-foreground"
          : "text-sidebar-foreground hover:bg-sidebar-accent/60 hover:text-foreground",
        isUnread && "font-semibold text-foreground",
        classRoom.isBanned && "opacity-50"
      )}
    >
      {/* Discord's unread pip on the left edge. */}
      {isUnread && (
        <span className="absolute -left-2 top-1/2 h-2 w-1 -translate-y-1/2 rounded-r-full bg-foreground" />
      )}
      <Hash className="h-4 w-4 shrink-0 opacity-70" />
      <span className="truncate">{classRoom.name}</span>

      <span className="ml-auto flex items-center gap-1">
        {classRoom.isMuted && <MicOff className="h-3.5 w-3.5" aria-label="Muted" />}
        {classRoom.isBanned && <Ban className="h-3.5 w-3.5" aria-label="Banned" />}
        {!isActive && <CountBadge count={classRoom.unreadCount} />}
      </span>
    </Link>
  );
}

function ChannelList() {
  const { data: classes, isLoading, isError } = useMyClasses();

  if (isLoading) {
    return (
      <div className="space-y-2 px-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-6 w-full bg-sidebar-accent/60" />
        ))}
      </div>
    );
  }

  if (isError) {
    return <p className="px-2 text-xs text-muted-foreground">Couldn&apos;t load your classes.</p>;
  }

  if (!classes?.length) {
    return (
      <p className="px-2 text-xs leading-relaxed text-muted-foreground">
        You haven&apos;t joined any classes yet.{" "}
        <Link href="/classes" className="font-medium text-primary hover:underline">
          Browse classes
        </Link>
      </p>
    );
  }

  return (
    <nav className="space-y-0.5">
      {classes.map((classRoom) => (
        <ChannelLink key={classRoom.id} classRoom={classRoom} />
      ))}
    </nav>
  );
}

function SidebarContent() {
  const { data: me } = useProfile();
  const sidebar = useSidebar();

  return (
    <div className="flex h-full w-full flex-col bg-sidebar">
      <div className="flex h-12 shrink-0 items-center gap-2 border-b border-border px-4 shadow-sm">
        <GraduationCap className="h-5 w-5 text-primary" />
        <span className="font-bold">CampusHub</span>
        <Button
          variant="ghost"
          size="icon"
          className="ml-auto h-8 w-8 md:hidden"
          onClick={sidebar.close}
          aria-label="Close sidebar"
        >
          <X className="h-5 w-5" />
        </Button>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-2 py-3">
        <div className="space-y-0.5">
          <NavLink href="/" icon={Home}>
            Home
          </NavLink>
          <NavLink href="/classes" icon={Compass}>
            Browse classes
          </NavLink>
        </div>

        <div className="mb-1 mt-5 flex items-center justify-between pl-2 pr-1">
          <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Your classes
          </span>
          {me?.role === "ADMIN" ? (
            <CreateClassDialog
              trigger={
                <button
                  className="rounded text-muted-foreground transition-colors hover:text-foreground"
                  aria-label="Create class"
                  title="Create class"
                >
                  <Plus className="h-4 w-4" />
                </button>
              }
            />
          ) : (
            <Link
              href="/classes"
              className="rounded text-muted-foreground transition-colors hover:text-foreground"
              aria-label="Join a class"
              title="Join a class"
            >
              <Plus className="h-4 w-4" />
            </Link>
          )}
        </div>

        <ChannelList />
      </div>

      <UserPanel />
    </div>
  );
}

/**
 * Fixed 240px column on desktop; slide-over drawer on mobile.
 */
export function AppSidebar() {
  const sidebar = useSidebar();

  return (
    <>
      <aside className="hidden w-60 shrink-0 md:flex">
        <SidebarContent />
      </aside>

      <div
        className={cn(
          "fixed inset-0 z-40 bg-black/60 transition-opacity md:hidden",
          sidebar.isOpen ? "opacity-100" : "pointer-events-none opacity-0"
        )}
        onClick={sidebar.close}
        aria-hidden
      />
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-72 max-w-[85vw] transition-transform duration-200 md:hidden",
          sidebar.isOpen ? "translate-x-0" : "-translate-x-full"
        )}
        inert={!sidebar.isOpen}
      >
        <SidebarContent />
      </aside>
    </>
  );
}
