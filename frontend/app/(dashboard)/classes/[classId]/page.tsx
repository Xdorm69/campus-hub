"use client";

import { use } from "react";
import { AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { CreatePost } from "@/components/classes/CreatePost";
import { Feed } from "@/features/classes/Feed";
import { MembersPanel } from "@/features/classes/MembersPanel";
import { useClass, useJoinClass, useLeaveClass } from "@/hooks/useClasses";
import { useProfile } from "@/hooks/useProfile";
import { ErrorBoundary } from "@/components/ui/error-boundary";

export default function ClassDetailsPage({
  params,
}: {
  params: Promise<{ classId: string }>;
}) {
  const { classId } = use(params);
  const { data: classItem, isLoading, isError } = useClass(classId);
  const { data: me } = useProfile();
  const join = useJoinClass(classId);
  const leave = useLeaveClass(classId);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-72" />
        <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
          <div className="space-y-3">
            <Skeleton className="h-28 w-full" />
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-24 w-full" />
          </div>
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    );
  }

  if (isError || !classItem) {
    return (
      <div className="flex flex-col items-center gap-2 rounded-lg border border-border py-16 text-center">
        <AlertCircle className="h-8 w-8 text-destructive" />
        <p className="font-medium">Couldn&apos;t load this class.</p>
        <p className="text-sm text-muted-foreground">It may not exist, or you may not have access.</p>
      </div>
    );
  }

  const canModerate = classItem.moderator || me?.role === "ADMIN";
  const isPending = join.isPending || leave.isPending;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-serif text-3xl font-semibold">{classItem.name}</h1>
          <p className="mt-1 max-w-2xl text-muted-foreground">{classItem.description}</p>
        </div>

        {classItem.isMember ? (
          <Button
            variant="outline"
            isLoading={leave.isPending}
            disabled={isPending}
            onClick={() => leave.mutate()}
          >
            Leave class
          </Button>
        ) : (
          <Button isLoading={join.isPending} disabled={isPending} onClick={() => join.mutate()}>
            Join class
          </Button>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="space-y-4">
          {classItem.isMember ? (
            <ErrorBoundary fallbackTitle="Couldn't load the post composer or feed.">
              <CreatePost classId={classId} />
              <Feed classId={classId} />
            </ErrorBoundary>
          ) : (
            <div className="rounded-lg border border-dashed border-border py-12 text-center text-sm text-muted-foreground">
              Join this class to see its feed and post updates.
            </div>
          )}
        </div>

        <aside>
          <ErrorBoundary fallbackTitle="Couldn't load members.">
            <MembersPanel classId={classId} canModerate={canModerate} />
          </ErrorBoundary>
        </aside>
      </div>
    </div>
  );
}
