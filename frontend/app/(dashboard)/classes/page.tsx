"use client";

import { useState } from "react";
import { Compass, Plus, Search, SearchX } from "lucide-react";
import { PageBody, PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { ClassCard } from "@/features/classes/ClassCard";
import { CreateClassDialog } from "@/features/classes/CreateClassDialog";
import { useClasses } from "@/hooks/useClasses";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { useProfile } from "@/hooks/useProfile";

export default function BrowseClassesPage() {
  const { data: me } = useProfile();
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebouncedValue(search.trim(), 300);
  const { data: classes, isLoading, isError, isFetching } = useClasses(debouncedSearch);

  return (
    <>
      <PageHeader
        icon={<Compass className="h-5 w-5" />}
        title="Browse classes"
        actions={
          me?.role === "ADMIN" && (
            <CreateClassDialog
              trigger={
                <Button size="sm" className="h-8">
                  <Plus className="h-4 w-4" /> Create class
                </Button>
              }
            />
          )
        }
      />

      <PageBody>
        <section className="bg-auth-gradient mb-8 overflow-hidden rounded-xl px-6 py-10 text-center text-white md:py-14">
          <h2 className="text-2xl font-extrabold md:text-3xl">Find your classes on CampusHub</h2>
          <p className="mx-auto mt-2 max-w-lg text-sm text-white/80 md:text-base">
            Join a class to chat with classmates, share notes, and get help before the exam.
          </p>
          <div className="relative mx-auto mt-6 max-w-md">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, code or description"
              className="h-11 bg-background pl-9 text-foreground"
              aria-label="Search classes"
            />
          </div>
        </section>

        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold">
            {debouncedSearch ? `Results for “${debouncedSearch}”` : "All classes"}
          </h3>
          {isFetching && !isLoading && <span className="text-xs text-muted-foreground">Updating…</span>}
        </div>

        {isLoading && (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-64 w-full rounded-lg" />
            ))}
          </div>
        )}

        {isError && (
          <EmptyState
            icon={Compass}
            title="Couldn't load classes"
            description="Refresh the page to try again."
          />
        )}

        {classes?.length === 0 && (
          <EmptyState
            icon={SearchX}
            title={debouncedSearch ? "No classes match your search" : "No classes yet"}
            description={debouncedSearch ? "Try a different name or code." : "Check back soon."}
          />
        )}

        {classes && classes.length > 0 && (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {classes.map((classRoom) => (
              <ClassCard key={classRoom.id} classRoom={classRoom} />
            ))}
          </div>
        )}
      </PageBody>
    </>
  );
}
