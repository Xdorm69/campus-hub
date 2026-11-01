"use client";

import { useState } from "react";
import { ChevronDown, Copy, Hash, LogOut, Settings, Trash2, Users } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { EditClassDialog } from "@/features/classes/EditClassDialog";
import { useDeleteClass, useLeaveClass } from "@/hooks/useClasses";
import { cn } from "@/lib/utils";
import { ClassRoom } from "@/types/class";

interface ChatHeaderProps {
  classRoom: ClassRoom;
  isAdmin: boolean;
  membersOpen: boolean;
  onToggleMembers: () => void;
}

type DialogKind = "edit" | "leave" | "delete" | null;

function ClassMenu({ classRoom, isAdmin }: { classRoom: ClassRoom; isAdmin: boolean }) {
  const [dialog, setDialog] = useState<DialogKind>(null);
  const leave = useLeaveClass(classRoom.id);
  const remove = useDeleteClass(classRoom.id);
  const close = () => setDialog(null);

  const copyCode = async () => {
    await navigator.clipboard.writeText(classRoom.code);
    toast.success(`Copied ${classRoom.code}`);
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="h-8 w-8" aria-label="Class options">
            <ChevronDown className="h-5 w-5" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-52">
          <DropdownMenuItem onClick={copyCode}>
            <Copy className="mr-2 h-4 w-4" /> Copy class code
          </DropdownMenuItem>
          {isAdmin && (
            <DropdownMenuItem onClick={() => setDialog("edit")}>
              <Settings className="mr-2 h-4 w-4" /> Class settings
            </DropdownMenuItem>
          )}
          {classRoom.isMember && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem destructive onClick={() => setDialog("leave")}>
                <LogOut className="mr-2 h-4 w-4" /> Leave class
              </DropdownMenuItem>
            </>
          )}
          {isAdmin && (
            <DropdownMenuItem destructive onClick={() => setDialog("delete")}>
              <Trash2 className="mr-2 h-4 w-4" /> Delete class
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      {isAdmin && (
        <EditClassDialog classRoom={classRoom} open={dialog === "edit"} onOpenChange={(o) => !o && close()} />
      )}

      <ConfirmDialog
        open={dialog === "leave"}
        onOpenChange={(o) => !o && close()}
        title={`Leave #${classRoom.name}?`}
        description="You won't see new messages until you rejoin."
        confirmLabel="Leave class"
        destructive
        isLoading={leave.isPending}
        onConfirm={() => leave.mutate(undefined, { onSuccess: close })}
      />

      <ConfirmDialog
        open={dialog === "delete"}
        onOpenChange={(o) => !o && close()}
        title={`Delete #${classRoom.name}?`}
        description="This permanently deletes the class, every message and every uploaded file. This can't be undone."
        confirmLabel="Delete class"
        destructive
        isLoading={remove.isPending}
        onConfirm={() => remove.mutate()}
      />
    </>
  );
}

export function ChatHeader({ classRoom, isAdmin, membersOpen, onToggleMembers }: ChatHeaderProps) {
  return (
    <PageHeader
      icon={<Hash className="h-5 w-5" />}
      title={classRoom.name}
      description={classRoom.description}
      actions={
        <>
          <span className="mr-1 hidden rounded bg-secondary px-1.5 py-0.5 font-mono text-xs text-muted-foreground sm:inline">
            {classRoom.code}
          </span>
          <Button
            variant="ghost"
            size="icon"
            className={cn("h-8 w-8", membersOpen && "text-foreground")}
            onClick={onToggleMembers}
            aria-label={membersOpen ? "Hide member list" : "Show member list"}
            aria-pressed={membersOpen}
            title="Member list"
          >
            <Users className="h-5 w-5" />
          </Button>
          <ClassMenu classRoom={classRoom} isAdmin={isAdmin} />
        </>
      }
    />
  );
}
