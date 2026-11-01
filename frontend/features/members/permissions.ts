import { ClassMember } from "@/types/class";
import { CurrentUser } from "@/types/user";

/**
 * Client-side mirror of membership.service rules, used only to decide which
 * controls to show. The server remains the authority.
 */
export function canModerateMember(
  me: CurrentUser | undefined,
  canModerateClass: boolean,
  member: ClassMember
) {
  if (!me || !canModerateClass) return false;
  if (member.userId === me.id) return false;
  if (member.user.role === "ADMIN") return false;
  // Moderators can't act on other moderators; admins can.
  return me.role === "ADMIN" || !member.isModerator;
}
