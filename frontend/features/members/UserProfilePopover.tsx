"use client";

import { useState } from "react";
import { Ban, MicOff, ShieldCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Skeleton } from "@/components/ui/skeleton";
import { UserAvatar } from "@/components/ui/user-avatar";
import { useMembers } from "@/hooks/useMembers";
import { useProfile, useUserProfile } from "@/hooks/useProfile";
import { formatDate } from "@/lib/format";
import { ProfileBanner } from "@/components/ui/profile-banner";
import { ClassMember } from "@/types/class";
import { KickMemberDialog, MemberActions } from "./MemberActions";
import { canModerateMember } from "./permissions";

interface ProfileTarget {
  userId: string;
  classId: string;
  canModerateClass: boolean;
}

/** Popover body. Only mounted while open, so its queries are lazy. */
function UserProfileCard({
  userId,
  classId,
  canModerateClass,
  onRequestKick,
}: ProfileTarget & { onRequestKick: (member: ClassMember) => void }) {
  const { data: me } = useProfile();
  const { data: profile, isLoading } = useUserProfile(userId);
  // Shares the member list's cache, so this is usually free.
  const { data: members } = useMembers(classId);
  const member = members?.find((m) => m.userId === userId);

  const showActions = member && canModerateMember(me, canModerateClass, member);

  return (
    <>
      {/* Falls back to the user's color until the profile has loaded. */}
      <ProfileBanner user={profile ?? { id: userId }} className="h-20" />

      <div className="px-4 pb-4">
        <div className="relative z-10 -mt-9 mb-2 w-fit rounded-full border-[6px] border-popover">
          {profile ? (
            <UserAvatar user={profile} className="h-16 w-16" fallbackClassName="text-xl" />
          ) : (
            <Skeleton className="h-16 w-16 rounded-full" />
          )}
        </div>

        {isLoading || !profile ? (
          <div className="space-y-2">
            <Skeleton className="h-5 w-32" />
            <Skeleton className="h-4 w-48" />
          </div>
        ) : (
          <>
            <div className="flex flex-wrap items-center gap-1.5">
              <p className="text-lg font-bold">{profile.username}</p>
              {profile.role === "ADMIN" && <Badge variant="destructive">Admin</Badge>}
              {member?.isModerator && (
                <Badge variant="success">
                  <ShieldCheck className="h-3 w-3" /> Mod
                </Badge>
              )}
            </div>
            {profile.email && <p className="text-sm text-muted-foreground">{profile.email}</p>}

            {(member?.muted || member?.banned) && (
              <div className="mt-2 flex gap-1.5">
                {member.muted && (
                  <Badge variant="warning">
                    <MicOff className="h-3 w-3" /> Muted
                  </Badge>
                )}
                {member.banned && (
                  <Badge variant="destructive">
                    <Ban className="h-3 w-3" /> Banned
                  </Badge>
                )}
              </div>
            )}

            <div className="mt-3 space-y-3 rounded-md bg-card p-3 text-sm">
              {profile.bio && (
                <section>
                  <h4 className="mb-1 text-xs font-bold uppercase text-muted-foreground">About me</h4>
                  <p className="whitespace-pre-wrap break-words">{profile.bio}</p>
                </section>
              )}
              <section>
                <h4 className="mb-1 text-xs font-bold uppercase text-muted-foreground">Member since</h4>
                <p>
                  CampusHub {formatDate(profile.createdAt)}
                  {member && <> · Class {formatDate(member.joinedAt)}</>}
                </p>
              </section>
            </div>

            {showActions && (
              <div className="mt-3 border-t border-border pt-3">
                <MemberActions
                  classId={classId}
                  member={member}
                  isAdmin={me?.role === "ADMIN"}
                  onRequestKick={() => onRequestKick(member)}
                />
              </div>
            )}
          </>
        )}
      </div>
    </>
  );
}

/**
 * Discord-style profile card on click. Moderation controls appear when the
 * viewer is allowed to act on this member.
 */
export function UserProfilePopover({
  children,
  side = "right",
  ...target
}: ProfileTarget & { children: React.ReactNode; side?: "left" | "right" | "top" | "bottom" }) {
  const [open, setOpen] = useState(false);
  const [kickTarget, setKickTarget] = useState<ClassMember | null>(null);

  return (
    <>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>{children}</PopoverTrigger>
        <PopoverContent side={side} align="start" className="w-72 overflow-hidden p-0">
          <UserProfileCard
            {...target}
            onRequestKick={(member) => {
              setOpen(false);
              setKickTarget(member);
            }}
          />
        </PopoverContent>
      </Popover>

      {kickTarget && (
        <KickMemberDialog
          classId={target.classId}
          member={kickTarget}
          onClose={() => setKickTarget(null)}
        />
      )}
    </>
  );
}
