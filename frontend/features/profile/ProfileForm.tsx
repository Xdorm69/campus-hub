"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useUpdateProfile } from "@/hooks/useProfile";
import { getErrorMessage } from "@/lib/api-error";
import { CurrentUser } from "@/types/user";
import { ProfileFormValues, profileSchema } from "./schemas";

export function ProfileForm({ user }: { user: CurrentUser }) {
  const updateProfile = useUpdateProfile();

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors, isDirty },
  } = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: { username: user.username, bio: user.bio ?? "" },
  });

  const bioLength = watch("bio")?.length ?? 0;

  const onSubmit = (values: ProfileFormValues) => {
    updateProfile.mutate(values, {
      // Re-baseline so the Save button disables again.
      onSuccess: (updated) => reset({ username: updated.username, bio: updated.bio ?? "" }),
    });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
      <FormField id="username" label="Username" error={errors.username?.message}>
        <Input id="username" autoComplete="username" {...register("username")} />
      </FormField>

      <FormField
        id="bio"
        label="About me"
        error={errors.bio?.message}
        hint={`${bioLength}/280 — shown on your profile card.`}
      >
        <Textarea
          id="bio"
          rows={4}
          maxLength={280}
          placeholder="Tell your classmates a bit about yourself"
          {...register("bio")}
        />
      </FormField>

      {updateProfile.isError && (
        <p className="text-sm text-destructive">{getErrorMessage(updateProfile.error)}</p>
      )}

      <div className="flex justify-end gap-2">
        <Button
          type="button"
          variant="ghost"
          disabled={!isDirty}
          onClick={() => reset()}
        >
          Reset
        </Button>
        <Button type="submit" isLoading={updateProfile.isPending} disabled={!isDirty}>
          Save changes
        </Button>
      </div>
    </form>
  );
}
