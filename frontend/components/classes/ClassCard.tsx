"use client";

import Link from "next/link";
import { Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useJoinClass, useLeaveClass } from "@/hooks/useClasses";
import { ClassSummary } from "@/types/class";

export function ClassCard({ classItem }: { classItem: ClassSummary }) {
  const join = useJoinClass(classItem.id);
  const leave = useLeaveClass(classItem.id);
  const isPending = join.isPending || leave.isPending;

  return (
    <Card className="flex flex-col">
      <CardHeader>
        <CardTitle>
          <Link href={`/classes/${classItem.id}`} className="hover:underline">
            {classItem.name}
          </Link>
        </CardTitle>
        <p className="line-clamp-2 text-sm text-muted-foreground">
          {classItem.description}
        </p>
      </CardHeader>
      <CardContent className="mt-auto flex items-center gap-1.5 pt-0 text-sm text-muted-foreground">
        <Users className="h-4 w-4" />
        {classItem.memberCount} {classItem.memberCount === 1 ? "member" : "members"}
      </CardContent>
      <CardFooter className="gap-2">
        {classItem.isMember ? (
          <Button
            variant="outline"
            size="sm"
            className="w-full"
            isLoading={leave.isPending}
            disabled={isPending}
            onClick={() => leave.mutate()}
          >
            Leave
          </Button>
        ) : (
          <Button
            size="sm"
            className="w-full"
            isLoading={join.isPending}
            disabled={isPending}
            onClick={() => join.mutate()}
          >
            Join
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}
