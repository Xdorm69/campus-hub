"use client";

import { Ban, Hash, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useJoinClass } from "@/hooks/useClasses";
import { formatDayDivider } from "@/lib/format";
import { ClassRoom } from "@/types/class";

/** Shown at the very top once all history is loaded. */
export function ChatWelcome({ classRoom }: { classRoom: ClassRoom }) {
  return (
    <div className="px-4 pb-2 pt-8">
      <div className="mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-secondary">
        <Hash className="h-10 w-10" />
      </div>
      <h2 className="text-3xl font-bold">Welcome to #{classRoom.name}!</h2>
      <p className="mt-1 text-muted-foreground">
        This is the start of the <span className="font-semibold">#{classRoom.name}</span> channel.
        {classRoom.description && ` ${classRoom.description}`}
      </p>
    </div>
  );
}

export function DateDivider({ date }: { date: string }) {
  return (
    <div className="relative mx-4 mb-1 mt-6 flex items-center" role="separator">
      <div className="h-px flex-1 bg-border" />
      <span className="px-2 text-xs font-semibold text-muted-foreground">{formatDayDivider(date)}</span>
      <div className="h-px flex-1 bg-border" />
    </div>
  );
}

export function MessageSkeletons({ count = 6 }: { count?: number }) {
  return (
    <div className="space-y-6 px-4 py-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="flex gap-4">
          <Skeleton className="h-10 w-10 shrink-0 rounded-full" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-40" />
            <Skeleton className="h-4" style={{ width: `${40 + ((i * 37) % 50)}%` }} />
          </div>
        </div>
      ))}
    </div>
  );
}

function CenteredState({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-3 p-8 text-center">{children}</div>
  );
}

export function JoinPrompt({ classRoom }: { classRoom: ClassRoom }) {
  const join = useJoinClass(classRoom.id);

  return (
    <CenteredState>
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-secondary">
        <Lock className="h-8 w-8 text-muted-foreground" />
      </div>
      <h2 className="text-2xl font-bold">#{classRoom.name}</h2>
      <p className="max-w-md text-muted-foreground">
        {classRoom.description || "Join this class to read and send messages."}
      </p>
      <p className="text-sm text-muted-foreground">
        {classRoom.memberCount} {classRoom.memberCount === 1 ? "member" : "members"}
      </p>
      <Button className="mt-2" isLoading={join.isPending} onClick={() => join.mutate()}>
        Join #{classRoom.name}
      </Button>
    </CenteredState>
  );
}

export function BannedState({ classRoom }: { classRoom: ClassRoom }) {
  return (
    <CenteredState>
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-destructive/15">
        <Ban className="h-8 w-8 text-destructive" />
      </div>
      <h2 className="text-2xl font-bold">You&apos;re banned from #{classRoom.name}</h2>
      <p className="max-w-md text-muted-foreground">
        A moderator has removed your access to this class. Reach out to them if you think this is a
        mistake.
      </p>
    </CenteredState>
  );
}
