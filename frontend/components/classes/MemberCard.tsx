"use client";

import { useState } from "react";
import { MoreVertical, ShieldCheck } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useModerateMember, useRemoveMember } from "@/hooks/useMembers";
import { ClassMember } from "@/types/class";

export function MemberCard({
  member,
  classId,
  canModerate,
}: {
  member: ClassMember;
  classId: string;
  canModerate: boolean;
}) {
  const moderate = useModerateMember(classId);
  const remove = useRemoveMember(classId);
  const [confirmRemove, setConfirmRemove] = useState(false);

  const initials = member.user.username.slice(0, 2).toUpperCase();

  return (
    <div className="flex items-center justify-between gap-3 rounded-md px-2 py-2 hover:bg-secondary/60">
      <div className="flex min-w-0 items-center gap-3">
        <Avatar className="h-9 w-9">
          <AvatarImage src={member.user.avatarUrl ?? undefined} alt={member.user.username} />
          <AvatarFallback className="text-xs">{initials}</AvatarFallback>
        </Avatar>
        <div className="min-w-0">
          <div className="flex items-center gap-1.5">
            <p className="truncate text-sm font-medium">{member.user.username}</p>
            {member.role === "MODERATOR" && (
              <ShieldCheck className="h-3.5 w-3.5 shrink-0 text-primary" aria-label="Moderator" />
            )}
          </div>
          <div className="flex gap-1.5 text-xs text-muted-foreground">
            {member.isMuted && <span>Muted</span>}
            {member.isBanned && <span>Banned</span>}
          </div>
        </div>
      </div>

      {canModerate && (
        <>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                onClick={() => moderate.mutate({ memberId: member.id, payload: { isMuted: !member.isMuted } })}
              >
                {member.isMuted ? "Unmute" : "Mute"}
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => moderate.mutate({ memberId: member.id, payload: { isBanned: !member.isBanned } })}
              >
                {member.isBanned ? "Unban" : "Ban"}
              </DropdownMenuItem>
              {member.role !== "MODERATOR" && (
                <DropdownMenuItem
                  onClick={() => moderate.mutate({ memberId: member.id, payload: { role: "MODERATOR" } })}
                >
                  Promote to moderator
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem destructive onClick={() => setConfirmRemove(true)}>
                Remove from class
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <ConfirmDialog
            open={confirmRemove}
            onOpenChange={setConfirmRemove}
            title="Remove member?"
            description={`${member.user.username} will be removed from this class and can rejoin later unless banned.`}
            confirmLabel="Remove"
            destructive
            isLoading={remove.isPending}
            onConfirm={() =>
              remove.mutate(member.id, { onSuccess: () => setConfirmRemove(false) })
            }
          />
        </>
      )}
    </div>
  );
}
