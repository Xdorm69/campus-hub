import { z } from "zod";

const classCodeSchema = z
    .string()
    .trim()
    .min(3, "Code must be at least 3 characters")
    .max(12, "Code must be 12 characters or fewer")
    .regex(/^[a-zA-Z0-9-]+$/, "Code can only contain letters, numbers, and dashes")
    .toUpperCase();

const classNameSchema = z
    .string()
    .trim()
    .min(2, "Name must be at least 2 characters")
    .max(60, "Name must be 60 characters or fewer");

const descriptionSchema = z.string().trim().max(500, "Description must be 500 characters or fewer");

export const createClassSchema = z.object({
    code: classCodeSchema,
    name: classNameSchema,
    description: descriptionSchema.optional(),
});

export const updateClassSchema = z
    .object({
        name: classNameSchema.optional(),
        description: descriptionSchema.optional(),
    })
    .refine((data) => data.name !== undefined || data.description !== undefined, {
        message: "Provide at least one field to update.",
    });

export const listClassesQuerySchema = z.object({
    search: z.string().trim().max(100).optional(),
});

export const updateMemberStatusSchema = z
    .object({
        role: z.enum(["MEMBER", "MODERATOR"]).optional(),
        isMuted: z.boolean().optional(),
        isBanned: z.boolean().optional(),
    })
    .refine(
        (data) => data.role !== undefined || data.isMuted !== undefined || data.isBanned !== undefined,
        { message: "Provide at least one field to update." }
    );
