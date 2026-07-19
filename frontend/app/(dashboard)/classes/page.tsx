"use client";

import { GraduationCap } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { ClassCard } from "@/components/classes/ClassCard";
import { useClasses } from "@/hooks/useClasses";

export default function ClassesPage() {
  const { data: classes, isLoading, isError } = useClasses();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-3xl font-semibold">Browse classes</h1>
        <p className="mt-1 text-muted-foreground">Join a class to see its feed and post updates.</p>
      </div>

      {isLoading && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-40 w-full" />
          ))}
        </div>
      )}

      {isError && (
        <EmptyState
          icon={GraduationCap}
          title="Couldn't load classes"
          description="Refresh the page to try again."
        />
      )}

      {classes?.length === 0 && (
        <EmptyState icon={GraduationCap} title="No classes yet" description="Check back soon." />
      )}

      {classes && classes.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {classes.map((classItem) => (
            <ClassCard key={classItem.id} classItem={classItem} />
          ))}
        </div>
      )}
    </div>
  );
}
