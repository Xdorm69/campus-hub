import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn, colorFromSeed, getInitials } from "@/lib/utils";

interface UserAvatarProps {
  user: { id?: string; username: string; avatarUrl: string | null } | null | undefined;
  className?: string;
  fallbackClassName?: string;
}

/** Avatar with a stable per-user color behind the initials. */
export function UserAvatar({ user, className, fallbackClassName }: UserAvatarProps) {
  const username = user?.username ?? "Deleted user";

  return (
    <Avatar className={cn("h-10 w-10", className)}>
      {user?.avatarUrl && <AvatarImage src={user.avatarUrl} alt={username} />}
      <AvatarFallback
        className={cn("text-sm", fallbackClassName)}
        style={{ backgroundColor: colorFromSeed(user?.id ?? username) }}
      >
        {getInitials(username)}
      </AvatarFallback>
    </Avatar>
  );
}
