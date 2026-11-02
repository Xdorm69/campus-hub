"use client";

import { useRef } from "react";
import { Camera, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { UserAvatar } from "@/components/ui/user-avatar";
import { useRemoveAvatar, useUploadAvatar } from "@/hooks/useProfile";
import { AVATAR_LIMITS } from "@/lib/constants";
import { formatBytes } from "@/lib/format";
import { CurrentUser } from "@/types/user";

const ACCEPTED_TYPES: readonly string[] = AVATAR_LIMITS.ACCEPT;

export function AvatarUploader({ user }: { user: CurrentUser }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const upload = useUploadAvatar();
  const remove = useRemoveAvatar();
  const isBusy = upload.isPending || remove.isPending;

  const handleFile = (file: File | undefined) => {
    if (!file) return;
    if (!ACCEPTED_TYPES.includes(file.type)) {
      toast.error("Avatar must be a PNG, JPEG, GIF or WebP image.");
      return;
    }
    if (file.size > AVATAR_LIMITS.MAX_SIZE) {
      toast.error(`Avatar must be smaller than ${formatBytes(AVATAR_LIMITS.MAX_SIZE)}.`);
      return;
    }
    upload.mutate(file);
  };

  return (
    // items-end keeps the buttons below the banner while the avatar overlaps it.
    <div className="relative z-10 flex items-end gap-4">
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={isBusy}
        className="group relative rounded-full border-[6px] border-card"
        aria-label="Change avatar"
      >
        <UserAvatar user={user} className="h-20 w-20" fallbackClassName="text-2xl" />
        <span className="absolute inset-0 flex items-center justify-center rounded-full bg-black/60 text-[10px] font-bold uppercase text-white opacity-0 transition-opacity group-hover:opacity-100">
          {isBusy ? <Loader2 className="h-5 w-5 animate-spin" /> : "Change avatar"}
        </span>
        <span className="absolute right-0 top-0 rounded-full bg-primary p-1 text-primary-foreground shadow">
          <Camera className="h-3.5 w-3.5" />
        </span>
      </button>

      <input
        ref={inputRef}
        type="file"
        hidden
        accept={AVATAR_LIMITS.ACCEPT.join(",")}
        onChange={(event) => {
          handleFile(event.target.files?.[0]);
          event.target.value = "";
        }}
      />

      <div className="flex gap-2 pb-1.5">
        <Button size="sm" onClick={() => inputRef.current?.click()} isLoading={upload.isPending}>
          Upload avatar
        </Button>
        {user.avatarUrl && (
          <Button size="sm" variant="ghost" onClick={() => remove.mutate()} isLoading={remove.isPending}>
            Remove
          </Button>
        )}
      </div>
    </div>
  );
}
