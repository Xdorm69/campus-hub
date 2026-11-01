"use client";

import { Settings } from "lucide-react";
import { PageBody, PageHeader } from "@/components/layout/PageHeader";
import { Badge } from "@/components/ui/badge";
import { AvatarUploader } from "@/features/profile/AvatarUploader";
import { ProfileForm } from "@/features/profile/ProfileForm";
import { useProfile } from "@/hooks/useProfile";
import { formatDate } from "@/lib/format";
import { colorFromSeed } from "@/lib/utils";

export default function ProfilePage() {
  // The dashboard layout only renders once the profile has loaded.
  const { data: user } = useProfile();
  if (!user) return null;

  return (
    <>
      <PageHeader icon={<Settings className="h-5 w-5" />} title="My account" />

      <PageBody className="max-w-2xl">
        <div className="overflow-hidden rounded-lg bg-card ring-1 ring-border">
          <div className="h-24" style={{ backgroundColor: colorFromSeed(user.id) }} />

          <div className="px-4 pb-4 md:px-6">
            <div className="-mt-12 flex flex-wrap items-end justify-between gap-4">
              <AvatarUploader user={user} />
            </div>

            <div className="mt-3 flex flex-wrap items-center gap-2">
              <h2 className="text-xl font-bold">{user.username}</h2>
              {user.role === "ADMIN" && <Badge variant="destructive">Admin</Badge>}
            </div>
            <p className="text-sm text-muted-foreground">
              {user.email} · Joined {formatDate(user.createdAt)}
            </p>
          </div>
        </div>

        <section className="mt-6 rounded-lg bg-card p-4 ring-1 ring-border md:p-6">
          <h3 className="mb-4 text-lg font-semibold">Profile</h3>
          <ProfileForm user={user} />
        </section>
      </PageBody>
    </>
  );
}
