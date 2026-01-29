import { z } from "zod";

/**
 * Schema for creating a new category
 */
export const CreateCategorySchema = z.object({
  name: z.string().min(1, "Name is required").max(100, "Name must be 100 characters or less"),
  slug: z.string().min(1, "Slug is required").max(100, "Slug must be 100 characters or less"),
  is_active: z.boolean().default(true),
  sort_order: z.number().int().default(0),
});

/**
 * Schema for updating a category
 */
export const UpdateCategorySchema = z.object({
  name: z.string().min(1, "Name is required").max(100, "Name must be 100 characters or less").optional(),
  slug: z.string().min(1, "Slug is required").max(100, "Slug must be 100 characters or less").optional(),
  is_active: z.boolean().optional(),
  sort_order: z.number().int().optional(),
});

export type CreateCategoryInput = z.infer<typeof CreateCategorySchema>;
export type UpdateCategoryInput = z.infer<typeof UpdateCategorySchema>;
