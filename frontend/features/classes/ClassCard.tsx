"use client";

import Link from "next/link";
import { Ban, MessageSquare, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CountBadge } from "@/components/ui/badge";
import { useJoinClass } from "@/hooks/useClasses";
import { formatRelative } from "@/lib/format";
import { colorFromSeed, getInitials } from "@/lib/utils";
import { ClassRoom, JoinedClass } from "@/types/class";

function isJoinedClass(classRoom: ClassRoom): classRoom is JoinedClass {
  return "unreadCount" in classRoom;
}

/** Discovery-style card: color banner, icon, details, primary action. */
export function ClassCard({ classRoom }: { classRoom: ClassRoom | JoinedClass }) {
  const join = useJoinClass(classRoom.id);
  const color = colorFromSeed(classRoom.id);
  const href = `/classes/${classRoom.id}`;

  return (
    <div className="group flex flex-col overflow-hidden rounded-lg bg-card shadow-sm ring-1 ring-border transition hover:-translate-y-0.5 hover:shadow-lg">
      <div className="relative h-20" style={{ background: `linear-gradient(135deg, ${color}, ${color}99)` }}>
        <span className="absolute right-3 top-3 rounded bg-black/30 px-1.5 py-0.5 font-mono text-[11px] font-semibold text-white">
          {classRoom.code}
        </span>
      </div>

      <div className="relative flex flex-1 flex-col px-4 pb-4">
        <div
          className="-mt-7 mb-2 flex h-14 w-14 items-center justify-center rounded-2xl border-4 border-card text-lg font-bold text-white"
          style={{ backgroundColor: color }}
        >
          {getInitials(classRoom.name)}
        </div>

        <div className="flex items-center gap-2">
          <Link href={href} className="truncate font-semibold hover:underline">
            {classRoom.name}
          </Link>
          {isJoinedClass(classRoom) && <CountBadge count={classRoom.unreadCount} />}
        </div>
        <p className="mt-1 line-clamp-2 min-h-[2.5rem] text-sm text-muted-foreground">
          {classRoom.description || "No description yet."}
        </p>

        <div className="mt-3 flex items-center gap-4 text-xs text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-success" />
            <Users className="h-3.5 w-3.5" />
            {classRoom.memberCount} {classRoom.memberCount === 1 ? "member" : "members"}
          </span>
          <span className="truncate">Active {formatRelative(classRoom.lastMessageAt)}</span>
        </div>

        <div className="mt-4">
          {classRoom.isBanned ? (
            <Button variant="secondary" size="sm" className="w-full" disabled>
              <Ban className="h-4 w-4" /> Banned
            </Button>
          ) : classRoom.isMember ? (
            <Button variant="secondary" size="sm" className="w-full" asChild>
              <Link href={href}>
                <MessageSquare className="h-4 w-4" /> Open chat
              </Link>
            </Button>
          ) : (
            <Button
              size="sm"
              className="w-full"
              isLoading={join.isPending}
              onClick={() => join.mutate()}
            >
              Join class
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
