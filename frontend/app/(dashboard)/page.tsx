"use client";

import Link from "next/link";
import { GraduationCap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { ClassCard } from "@/components/classes/ClassCard";
import { useProfile, useMyClasses } from "@/hooks/useProfile";

export default function DashboardPage() {
  const { data: user, isLoading: isUserLoading } = useProfile();
  const { data: myClasses, isLoading: isClassesLoading } = useMyClasses();

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          {isUserLoading ? (
            <Skeleton className="h-9 w-64" />
          ) : (
            <h1 className="font-serif text-3xl font-semibold">
              Welcome back{user?.username ? `, ${user.username}` : ""}
            </h1>
          )}
          <p className="mt-1 text-muted-foreground">Here&apos;s what&apos;s happening in your classes.</p>
        </div>
        <Button>
          <Link href="/classes">Browse all classes</Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>My classes</CardTitle>
        </CardHeader>
        <CardContent>
          {isClassesLoading && (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <Skeleton className="h-40 w-full" />
              <Skeleton className="h-40 w-full" />
            </div>
          )}

          {myClasses?.length === 0 && (
            <EmptyState
              icon={GraduationCap}
              title="You haven't joined any classes yet"
              description="Browse classes to find one to join."
              action={
                <Button asChild size="sm">
                  <Link href="/classes">Browse classes</Link>
                </Button>
              }
              className="border-none"
            />
          )}

          {myClasses && myClasses.length > 0 && (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {myClasses.map((classItem) => (
                <ClassCard key={classItem.id} classItem={classItem} />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
