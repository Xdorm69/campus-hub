"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useUpdateProfile } from "@/hooks/useProfile";
import { User } from "@/types/user";
import { ProfileFormValues, profileSchema } from "./schemas";

export function ProfileForm({ user }: { user: User }) {
  const updateProfile = useUpdateProfile();
  const [justSaved, setJustSaved] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isDirty },
  } = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      username: user.username,
      bio: user.bio ?? "",
      avatarUrl: user.avatarUrl ?? "",
    },
  });

  useEffect(() => {
    if (!justSaved) return;
    const timeout = setTimeout(() => setJustSaved(false), 2500);
    return () => clearTimeout(timeout);
  }, [justSaved]);

  const onSubmit = (values: ProfileFormValues) => {
    updateProfile.mutate(
      { ...values, avatarUrl: values.avatarUrl || undefined },
      { onSuccess: () => setJustSaved(true) }
    );
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
      <div className="space-y-2">
        <Label htmlFor="username">Username</Label>
        <Input id="username" {...register("username")} />
        {errors.username && (
          <p className="text-sm text-destructive">{errors.username.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="avatarUrl">Avatar URL</Label>
        <Input id="avatarUrl" placeholder="https://..." {...register("avatarUrl")} />
        {errors.avatarUrl && (
          <p className="text-sm text-destructive">{errors.avatarUrl.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="bio">Bio</Label>
        <textarea
          id="bio"
          rows={3}
          maxLength={280}
          className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          placeholder="Tell your classmates a bit about yourself"
          {...register("bio")}
        />
        {errors.bio && <p className="text-sm text-destructive">{errors.bio.message}</p>}
      </div>

      <div className="flex items-center gap-3">
        <Button type="submit" isLoading={updateProfile.isPending} disabled={!isDirty}>
          Save changes
        </Button>
        {justSaved && <span className="text-sm text-primary">Saved.</span>}
        {updateProfile.isError && (
          <span className="text-sm text-destructive">Couldn&apos;t save. Try again.</span>
        )}
      </div>
    </form>
  );
}
