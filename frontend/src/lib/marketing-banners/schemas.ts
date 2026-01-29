/**
 * Marketing Banners Validation Schemas
 * Zod schemas for form validation
 */

import { z } from "zod";

export const createMarketingBannerSchema = z.object({
  title: z.string().min(1, "Title is required").max(200, "Title must be less than 200 characters"),
  description: z.string().optional(),
  image: z.union([z.string(), z.instanceof(File)]),
  link: z.string().optional(),
  is_active: z.boolean().optional().default(true),
  sort_order: z.number().int().optional().default(0),
  start_date: z.string().nullable().optional(),
  end_date: z.string().nullable().optional(),
});

export const updateMarketingBannerSchema = z.object({
  title: z.string().min(1, "Title is required").max(200, "Title must be less than 200 characters").optional(),
  description: z.string().optional(),
  image: z.union([z.string(), z.instanceof(File)]).optional(),
  link: z.string().optional(),
  is_active: z.boolean().optional(),
  sort_order: z.number().int().optional(),
  start_date: z.string().nullable().optional(),
  end_date: z.string().nullable().optional(),
});

export type CreateMarketingBannerFormData = z.infer<typeof createMarketingBannerSchema>;
export type UpdateMarketingBannerFormData = z.infer<typeof updateMarketingBannerSchema>;
