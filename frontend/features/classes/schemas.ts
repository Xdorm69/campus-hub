import { z } from "zod";

const nameSchema = z
  .string()
  .trim()
  .min(2, "Name must be at least 2 characters")
  .max(60, "Name must be 60 characters or fewer");

const descriptionSchema = z
  .string()
  .trim()
  .max(500, "Description must be 500 characters or fewer");

export const createClassSchema = z.object({
  code: z
    .string()
    .trim()
    .min(3, "Code must be at least 3 characters")
    .max(12, "Code must be 12 characters or fewer")
    .regex(/^[a-zA-Z0-9-]+$/, "Letters, numbers, and dashes only"),
  name: nameSchema,
  description: descriptionSchema,
});

export type CreateClassValues = z.infer<typeof createClassSchema>;

export const updateClassSchema = z.object({
  name: nameSchema,
  description: descriptionSchema,
});

export type UpdateClassValues = z.infer<typeof updateClassSchema>;
