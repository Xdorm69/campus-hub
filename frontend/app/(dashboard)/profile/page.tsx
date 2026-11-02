"use client";

import { Image as ImageIcon, Settings } from "lucide-react";
import { PageBody, PageHeader } from "@/components/layout/PageHeader";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ProfileBanner } from "@/components/ui/profile-banner";
import { AvatarUploader } from "@/features/profile/AvatarUploader";
import { BannerPicker } from "@/features/profile/BannerPicker";
import { ProfileForm } from "@/features/profile/ProfileForm";
import { useProfile } from "@/hooks/useProfile";
import { formatDate } from "@/lib/format";

export default function ProfilePage() {
  // The dashboard layout only renders once the profile has loaded.
  const { data: user } = useProfile();
  if (!user) return null;

  return (
    <>
      <PageHeader icon={<Settings className="h-5 w-5" />} title="My account" />

      <PageBody className="max-w-2xl">
        <div className="overflow-hidden rounded-lg bg-card ring-1 ring-border">
          <ProfileBanner user={user} className="h-32">
            <BannerPicker
              user={user}
              trigger={
                <Button
                  size="sm"
                  variant="secondary"
                  className="absolute right-3 top-3 h-8 bg-black/50 text-white backdrop-blur hover:bg-black/70"
                >
                  <ImageIcon className="h-4 w-4" /> Change banner
                </Button>
              }
            />
          </ProfileBanner>

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
