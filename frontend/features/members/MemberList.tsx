"use client";

import { Ban, Crown, MicOff, ShieldCheck } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { UserAvatar } from "@/components/ui/user-avatar";
import { useMembers } from "@/hooks/useMembers";
import { cn } from "@/lib/utils";
import { ClassMember } from "@/types/class";
import { UserProfilePopover } from "./UserProfilePopover";

interface MemberListProps {
  classId: string;
  canModerate: boolean;
  className?: string;
}

interface MemberGroup {
  label: string;
  members: ClassMember[];
}

/** Discord-like role sections. Banned users are only shown to moderators. */
function groupMembers(members: ClassMember[], canModerate: boolean): MemberGroup[] {
  const byName = (a: ClassMember, b: ClassMember) => a.user.username.localeCompare(b.user.username);
  const active = members.filter((m) => !m.banned).sort(byName);

  const groups: MemberGroup[] = [
    { label: "Admins", members: active.filter((m) => m.user.role === "ADMIN") },
    {
      label: "Moderators",
      members: active.filter((m) => m.user.role !== "ADMIN" && m.isModerator),
    },
    {
      label: "Members",
      members: active.filter((m) => m.user.role !== "ADMIN" && !m.isModerator),
    },
  ];

  if (canModerate) {
    groups.push({ label: "Banned", members: members.filter((m) => m.banned).sort(byName) });
  }

  return groups.filter((group) => group.members.length > 0);
}

function MemberRow({
  member,
  classId,
  canModerate,
}: {
  member: ClassMember;
  classId: string;
  canModerate: boolean;
}) {
  const isAdmin = member.user.role === "ADMIN";

  return (
    <UserProfilePopover userId={member.userId} classId={classId} canModerateClass={canModerate} side="left">
      <button
        type="button"
        className={cn(
          "flex w-full items-center gap-3 rounded-md px-2 py-1.5 text-left transition-colors hover:bg-sidebar-accent/60",
          (member.banned || member.muted) && "opacity-60"
        )}
      >
        <UserAvatar user={member.user} className="h-8 w-8" fallbackClassName="text-xs" />
        <span
          className={cn(
            "min-w-0 flex-1 truncate text-[15px] font-medium",
            isAdmin ? "text-destructive" : member.isModerator ? "text-success" : "text-sidebar-foreground"
          )}
        >
          {member.user.username}
        </span>
        <span className="flex shrink-0 items-center gap-1 text-muted-foreground">
          {isAdmin && <Crown className="h-3.5 w-3.5 text-warning" aria-label="Admin" />}
          {member.isModerator && !isAdmin && (
            <ShieldCheck className="h-3.5 w-3.5 text-success" aria-label="Moderator" />
          )}
          {member.muted && <MicOff className="h-3.5 w-3.5" aria-label="Muted" />}
          {member.banned && <Ban className="h-3.5 w-3.5 text-destructive" aria-label="Banned" />}
        </span>
      </button>
    </UserProfilePopover>
  );
}

export function MemberList({ classId, canModerate, className }: MemberListProps) {
  const { data: members, isLoading, isError } = useMembers(classId);

  return (
    <aside className={cn("flex w-60 shrink-0 flex-col bg-sidebar", className)}>
      <div className="min-h-0 flex-1 overflow-y-auto px-2 py-4">
        {isLoading && (
          <div className="space-y-3 px-2">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3">
                <Skeleton className="h-8 w-8 rounded-full" />
                <Skeleton className="h-4 flex-1" />
              </div>
            ))}
          </div>
        )}

        {isError && <p className="px-2 text-sm text-muted-foreground">Couldn&apos;t load members.</p>}

        {members &&
          groupMembers(members, canModerate).map((group) => (
            <section key={group.label} className="mb-4">
              <h3 className="mb-1 px-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                {group.label} — {group.members.length}
              </h3>
              {group.members.map((member) => (
                <MemberRow key={member.id} member={member} classId={classId} canModerate={canModerate} />
              ))}
            </section>
          ))}
      </div>
    </aside>
  );
}
