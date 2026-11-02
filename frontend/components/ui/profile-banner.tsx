import { resolveBanner } from "@/lib/banners";
import { cn } from "@/lib/utils";
import type { UserProfile } from "@/types/user";

interface ProfileBannerProps {
  user: Pick<UserProfile, "id" | "bannerUrl" | "bannerPreset"> | { id: string };
  className?: string;
  children?: React.ReactNode;
}

/**
 * The strip at the top of profile cards: the user's uploaded banner, their
 * chosen preset, or a color derived from their id.
 */
export function ProfileBanner({ user, className, children }: ProfileBannerProps) {
  const banner = resolveBanner(user);

  return (
    <div
      className={cn("relative overflow-hidden", className)}
      style={banner.kind === "color" ? { backgroundColor: banner.color } : undefined}
    >
      {banner.kind === "image" && (
        // eslint-disable-next-line @next/next/no-img-element -- user uploads live on the API origin
        <img src={banner.url} alt="" className="absolute inset-0 h-full w-full object-cover" />
      )}
      {children}
    </div>
  );
}
