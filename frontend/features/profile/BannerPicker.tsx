"use client";

import { useRef } from "react";
import { Check, ImagePlus, Loader2, RotateCcw } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ProfileBanner } from "@/components/ui/profile-banner";
import { useRemoveBanner, useSetBannerPreset, useUploadBanner } from "@/hooks/useProfile";
import { BANNER_PRESETS, bannerPresetUrl } from "@/lib/banners";
import { BANNER_LIMITS } from "@/lib/constants";
import { formatBytes } from "@/lib/format";
import { cn } from "@/lib/utils";
import { CurrentUser } from "@/types/user";

const ACCEPTED_TYPES: readonly string[] = BANNER_LIMITS.ACCEPT;

/** "Change banner" button + dialog: upload an image or pick a built-in one. */
export function BannerPicker({ user, trigger }: { user: CurrentUser; trigger: React.ReactNode }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const upload = useUploadBanner();
  const setPreset = useSetBannerPreset();
  const remove = useRemoveBanner();
  const isBusy = upload.isPending || setPreset.isPending || remove.isPending;
  const hasBanner = Boolean(user.bannerUrl || user.bannerPreset);

  const handleFile = (file: File | undefined) => {
    if (!file) return;
    if (!ACCEPTED_TYPES.includes(file.type)) {
      toast.error("Banner must be a PNG, JPEG, GIF or WebP image.");
      return;
    }
    if (file.size > BANNER_LIMITS.MAX_SIZE) {
      toast.error(`Banner must be smaller than ${formatBytes(BANNER_LIMITS.MAX_SIZE)}.`);
      return;
    }
    upload.mutate(file);
  };

  return (
    <Dialog>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>Profile banner</DialogTitle>
          <DialogDescription>Shown at the top of your profile card. Pick one of ours or upload your own.</DialogDescription>
        </DialogHeader>

        {/* Live preview of what others will see. */}
        <ProfileBanner user={user} className="h-28 rounded-lg">
          {isBusy && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/40">
              <Loader2 className="h-6 w-6 animate-spin text-white" />
            </div>
          )}
        </ProfileBanner>

        <div className="mt-3 flex flex-wrap items-center gap-2">
          <Button size="sm" onClick={() => inputRef.current?.click()} disabled={isBusy}>
            <ImagePlus className="h-4 w-4" /> Upload image
          </Button>
          {hasBanner && (
            <Button size="sm" variant="ghost" onClick={() => remove.mutate()} disabled={isBusy}>
              <RotateCcw className="h-4 w-4" /> Reset to default
            </Button>
          )}
          <span className="text-xs text-muted-foreground">
            PNG, JPEG, GIF or WebP · up to {formatBytes(BANNER_LIMITS.MAX_SIZE)} · best at 960×340
          </span>
          <input
            ref={inputRef}
            type="file"
            hidden
            accept={BANNER_LIMITS.ACCEPT.join(",")}
            onChange={(event) => {
              handleFile(event.target.files?.[0]);
              event.target.value = "";
            }}
          />
        </div>

        <h4 className="mb-2 mt-5 text-xs font-bold uppercase tracking-wide text-muted-foreground">
          Default banners
        </h4>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {BANNER_PRESETS.map((preset) => {
            const selected = !user.bannerUrl && user.bannerPreset === preset.id;
            return (
              <button
                key={preset.id}
                type="button"
                disabled={isBusy}
                onClick={() => !selected && setPreset.mutate(preset.id)}
                aria-pressed={selected}
                className={cn(
                  "group relative overflow-hidden rounded-md text-left outline-none ring-offset-2 ring-offset-card transition focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-60",
                  selected ? "ring-2 ring-primary" : "hover:ring-2 hover:ring-muted-foreground/40"
                )}
              >
                {/* eslint-disable-next-line @next/next/no-img-element -- static SVG asset */}
                <img src={bannerPresetUrl(preset.id)} alt="" className="aspect-[48/17] w-full object-cover" />
                <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent px-2 pb-1 pt-4 text-xs font-medium text-white">
                  {preset.label}
                </span>
                {selected && (
                  <span className="absolute right-1.5 top-1.5 rounded-full bg-primary p-0.5 text-primary-foreground">
                    <Check className="h-3 w-3" />
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </DialogContent>
    </Dialog>
  );
}
