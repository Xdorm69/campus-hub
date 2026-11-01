# Roles & permissions

The rules are enforced on the server in `backend/modules/membership/membership.service.js` and `messages.service.js`. The frontend copies some of them (`features/members/permissions.ts`), but only to decide which buttons to show.

## Roles

| Role          | Scope            | How you get it                                    |
| ------------- | ---------------- | ------------------------------------------------- |
| **Admin**     | Whole app        | `role: "ADMIN"` on the user, set by `pnpm seed` |
| **Moderator** | One class        | An admin promotes you, or you created the class   |
| **Member**    | One class        | You joined the class                              |
| **Muted**     | One class        | A moderator or admin muted you                    |
| **Banned**    | One class        | A moderator or admin banned you                   |

## Class access

| Action                         | Member | Muted | Banned | Not joined | Admin (not joined) |
| ------------------------------ | :----: | :---: | :----: | :--------: | :----------------: |
| See the class in Browse        | ✅     | ✅    | ✅     | ✅         | ✅                 |
| Read messages / sync           | ✅     | ✅    | ❌     | ❌         | ✅                 |
| Send messages                  | ✅     | ❌    | ❌     | ❌         | ❌ (must join)     |
| Edit own messages              | ✅     | ❌    | ❌     | ❌         | —                  |
| React to messages              | ✅     | ✅    | ❌     | ❌         | ❌                 |
| Delete own messages            | ✅     | ✅    | ✅²    | ✅²        | ✅                 |
| See member list                | ✅     | ✅    | ❌     | ✅         | ✅                 |
| Leave                          | ✅     | ✅    | ❌¹    | —          | —                  |
| Join                           | —      | —     | ❌     | ✅         | ✅                 |

¹ A ban is stored on the membership, and leaving deletes the membership. Allowing banned users to leave would let them rejoin with the ban gone.

² Authors can always remove what they posted, even after leaving or being banned. This is done through the API; the UI only shows the delete button inside rooms you can open.

## Moderation

Mute, ban, kick and promote all go through `PATCH` / `DELETE /classes/:classId/members/:userId`.

| Actor ↓ / target →  | Member | Moderator | Admin | Self |
| ------------------- | :----: | :-------: | :---: | :--: |
| **Moderator**       | mute · ban · kick | ❌ | ❌ | ❌ |
| **Admin**           | mute · ban · kick · promote | mute · ban · kick · demote | ❌ | ❌ |

- Only admins can change moderator status (`role: "MODERATOR" | "MEMBER"`).
- Banning a moderator also removes their moderator role.
- Kicking deletes the membership, so the person can rejoin. Banning keeps them out.

## Deleting messages

- Authors can always delete their own messages, even after being banned or leaving the class.
- Moderators can delete anyone's message in their class **except an admin's**.
- Admins can delete any message.

## Class management (admin only)

- `POST /classes`: create a class. The creator joins it automatically as moderator.
- `PATCH /classes/:id`: rename or change the description. The class code can't be changed.
- `DELETE /classes/:id`: deletes the class, all its memberships, all its messages and every uploaded file.

## Profiles

- `GET /users/:id` returns a public profile to any signed-in user. `email` and `verified` are included only when you look at your own profile or you're an admin.
