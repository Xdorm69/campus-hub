"use client";

import Link from "next/link";
import { Compass, GraduationCap, Home, MessageSquare } from "lucide-react";
import { PageBody, PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { ClassCard } from "@/features/classes/ClassCard";
import { useMyClasses } from "@/hooks/useClasses";
import { useProfile } from "@/hooks/useProfile";

function StatCard({ icon: Icon, label, value }: { icon: typeof Home; label: string; value: number }) {
  return (
    <div className="flex items-center gap-4 rounded-lg bg-card p-4 ring-1 ring-border">
      <div className="flex h-11 w-11 items-center justify-center rounded-full bg-primary/15 text-primary">
        <Icon className="h-5 w-5" />
      </div>
      <div>
        <p className="text-2xl font-bold leading-none">{value}</p>
        <p className="mt-1 text-sm text-muted-foreground">{label}</p>
      </div>
    </div>
  );
}

export default function HomePage() {
  const { data: user } = useProfile();
  const { data: classes, isLoading } = useMyClasses();

  const unreadTotal = classes?.reduce((sum, c) => sum + c.unreadCount, 0) ?? 0;
  // Most recently active first, so the busiest rooms are one click away.
  const sorted = [...(classes ?? [])].sort(
    (a, b) => new Date(b.lastMessageAt ?? 0).getTime() - new Date(a.lastMessageAt ?? 0).getTime()
  );

  return (
    <>
      <PageHeader icon={<Home className="h-5 w-5" />} title="Home" />

      <PageBody>
        <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold md:text-3xl">Welcome back, {user?.username} 👋</h2>
            <p className="mt-1 text-muted-foreground">Here&apos;s what&apos;s happening in your classes.</p>
          </div>
          <Button asChild variant="secondary">
            <Link href="/classes">
              <Compass className="h-4 w-4" /> Browse classes
            </Link>
          </Button>
        </div>

        <div className="mb-8 grid gap-4 sm:grid-cols-2">
          <StatCard icon={GraduationCap} label="Classes joined" value={classes?.length ?? 0} />
          <StatCard icon={MessageSquare} label="Unread messages" value={unreadTotal} />
        </div>

        <h3 className="mb-4 text-lg font-semibold">Your classes</h3>

        {isLoading && (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-64 w-full rounded-lg" />
            ))}
          </div>
        )}

        {classes?.length === 0 && (
          <EmptyState
            icon={GraduationCap}
            title="You haven't joined any classes yet"
            description="Browse classes to find one to join."
            action={
              <Button asChild size="sm">
                <Link href="/classes">Browse classes</Link>
              </Button>
            }
          />
        )}

        {sorted.length > 0 && (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {sorted.map((classRoom) => (
              <ClassCard key={classRoom.id} classRoom={classRoom} />
            ))}
          </div>
        )}
      </PageBody>
    </>
  );
}
