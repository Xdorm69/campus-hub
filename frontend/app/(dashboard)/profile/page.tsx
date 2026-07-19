"use client";

import { AlertCircle } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useProfile } from "@/hooks/useProfile";
import { ProfileForm } from "@/features/profile/ProfileForm";

export default function ProfilePage() {
  const { data: user, isLoading, isError } = useProfile();

  if (isLoading) {
    return (
      <div className="mx-auto max-w-xl space-y-6">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (isError || !user) {
    return (
      <div className="mx-auto flex max-w-xl flex-col items-center gap-2 rounded-lg border border-border py-16 text-center">
        <AlertCircle className="h-8 w-8 text-destructive" />
        <p className="font-medium">Couldn&apos;t load your profile.</p>
        <p className="text-sm text-muted-foreground">Refresh the page to try again.</p>
      </div>
    );
  }

  const initials = user.username.slice(0, 2).toUpperCase();

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <h1 className="font-serif text-3xl font-semibold">Your profile</h1>

      <Card>
        <CardHeader className="flex-row items-center gap-4 space-y-0">
          <Avatar className="h-14 w-14">
            <AvatarImage src={user.avatarUrl ?? undefined} alt={user.username} />
            <AvatarFallback>{initials}</AvatarFallback>
          </Avatar>
          <div>
            <CardTitle>{user.username}</CardTitle>
            <p className="text-sm text-muted-foreground">{user.email}</p>
          </div>
        </CardHeader>
        <CardContent>
          <ProfileForm user={user} />
        </CardContent>
      </Card>
    </div>
  );
}
