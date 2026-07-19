
import {z} from 'zod';
export const createClassSchema = z.object({
    code: z.string().min(5),
    name: z.string().min(2),
    description: z.string().optional(),
})

export const updateClassSchema = z.object({
    name: z.string().optional(),
    description: z.string().optional(),
}).refine(
    (data) => data.name !== undefined || data.description !== undefined,
    {
        message: "Provide at least one field to update.",
    }
);

export const updateUserRoleSchema = z
  .object({
    role: z.enum(["MEMBER", "MODERATOR"]).optional(),

    isMuted: z.boolean().optional(),

    isBanned: z.boolean().optional(),

    mutedUntil: z
      .string()
      .datetime()
      .nullable()
      .optional(),
  })
  .refine(
    (data) =>
      data.role !== undefined ||
      data.isMuted !== undefined ||
      data.isBanned !== undefined,
    {
      message: "Provide at least one field to update.",
    }
  );