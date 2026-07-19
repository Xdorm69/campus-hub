"use client";

import { Users } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { MemberCard } from "@/components/classes/MemberCard";
import { useMembers } from "@/hooks/useMembers";

export function MembersPanel({
  classId,
  canModerate,
}: {
  classId: string;
  canModerate: boolean;
}) {
  const { data: members, isLoading, isError } = useMembers(classId);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Members</CardTitle>
      </CardHeader>
      <CardContent className="space-y-1">
        {isLoading && (
          <div className="space-y-2">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        )}

        {isError && (
          <p className="text-sm text-muted-foreground">Couldn&apos;t load members.</p>
        )}

        {members?.length === 0 && (
          <EmptyState icon={Users} title="No members yet" className="border-none py-8" />
        )}

        {members?.map((member) => {
          return (
            <MemberCard key={member.id} member={member} classId={classId} canModerate={canModerate} />
          );
        })}
      </CardContent>
    </Card>
  );
}
