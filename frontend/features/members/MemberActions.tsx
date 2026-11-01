"use client";

import { Ban, Mic, MicOff, ShieldCheck, ShieldOff, UserMinus } from "lucide-react";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { useModerateMember, useRemoveMember } from "@/hooks/useMembers";
import { cn } from "@/lib/utils";
import { ClassMember, ModerateMemberPayload } from "@/types/class";

function ActionButton({
  icon: Icon,
  label,
  destructive,
  disabled,
  onClick,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  destructive?: boolean;
  disabled?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-sm transition-colors disabled:opacity-50",
        destructive
          ? "text-destructive hover:bg-destructive hover:text-destructive-foreground"
          : "hover:bg-primary hover:text-primary-foreground"
      )}
    >
      <Icon className="h-4 w-4" />
      {label}
    </button>
  );
}

interface MemberActionsProps {
  classId: string;
  member: ClassMember;
  isAdmin: boolean;
  /** Kicking needs a confirm dialog that must outlive the popover. */
  onRequestKick: () => void;
}

/** Mute / ban / promote / kick controls shown inside the profile popover. */
export function MemberActions({ classId, member, isAdmin, onRequestKick }: MemberActionsProps) {
  const moderate = useModerateMember(classId);

  const update = (payload: ModerateMemberPayload) =>
    moderate.mutate({ userId: member.userId, payload });

  return (
    <div className="space-y-0.5">
      <ActionButton
        icon={member.muted ? Mic : MicOff}
        label={member.muted ? "Unmute" : "Mute"}
        disabled={moderate.isPending}
        onClick={() => update({ isMuted: !member.muted })}
      />

      {isAdmin && !member.banned && (
        <ActionButton
          icon={member.isModerator ? ShieldOff : ShieldCheck}
          label={member.isModerator ? "Remove moderator" : "Make moderator"}
          disabled={moderate.isPending}
          onClick={() => update({ role: member.isModerator ? "MEMBER" : "MODERATOR" })}
        />
      )}

      <ActionButton
        icon={Ban}
        label={member.banned ? "Unban" : "Ban"}
        destructive={!member.banned}
        disabled={moderate.isPending}
        onClick={() => update({ isBanned: !member.banned })}
      />

      <ActionButton icon={UserMinus} label="Kick from class" destructive onClick={onRequestKick} />
    </div>
  );
}

export function KickMemberDialog({
  classId,
  member,
  onClose,
}: {
  classId: string;
  member: ClassMember;
  onClose: () => void;
}) {
  const remove = useRemoveMember(classId);

  return (
    <ConfirmDialog
      open
      onOpenChange={(open) => !open && onClose()}
      title={`Kick ${member.user.username}?`}
      description="They'll be removed from this class but can rejoin. Ban them instead to keep them out."
      confirmLabel="Kick"
      destructive
      isLoading={remove.isPending}
      onConfirm={() => remove.mutate(member.userId, { onSuccess: onClose })}
    />
  );
}
