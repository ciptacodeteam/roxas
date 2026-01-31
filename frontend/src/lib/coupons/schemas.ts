/**
 * Coupons Validation Schemas
 * Zod schemas for client-side validation
 */

import { z } from "zod";
import { DiscountType } from "./types";

export const createCouponSchema = z.object({
  code: z.string().min(1, "Code is required").max(50, "Code must be 50 characters or less"),
  description: z.string().optional(),
  discount_type: z.nativeEnum(DiscountType, {
    message: "Invalid discount type",
  }),
  discount_value: z.number().min(0, "Discount value must be positive"),
  min_purchase: z.number().min(0, "Minimum purchase must be positive").optional(),
  max_discount: z.number().min(0, "Maximum discount must be positive").nullable().optional(),
  usage_limit: z.number().min(1, "Usage limit must be at least 1").nullable().optional(),
  user_limit: z.number().min(1, "User limit must be at least 1").nullable().optional(),
  is_active: z.boolean().optional(),
  start_date: z.string().nullable().optional(),
  end_date: z.string().nullable().optional(),
}).refine(
  (data) => {
    // Validate that end_date is after start_date if both are provided
    if (data.start_date && data.end_date) {
      return new Date(data.end_date) > new Date(data.start_date);
    }
    return true;
  },
  {
    message: "End date must be after start date",
    path: ["end_date"],
  }
);

export const updateCouponSchema = z.object({
  code: z.string().min(1, "Code is required").max(50, "Code must be 50 characters or less").optional(),
  description: z.string().optional(),
  discount_type: z.nativeEnum(DiscountType, {
    message: "Invalid discount type",
  }).optional(),
  discount_value: z.number().min(0, "Discount value must be positive").optional(),
  min_purchase: z.number().min(0, "Minimum purchase must be positive").optional(),
  max_discount: z.number().min(0, "Maximum discount must be positive").nullable().optional(),
  usage_limit: z.number().min(1, "Usage limit must be at least 1").nullable().optional(),
  user_limit: z.number().min(1, "User limit must be at least 1").nullable().optional(),
  is_active: z.boolean().optional(),
  start_date: z.string().nullable().optional(),
  end_date: z.string().nullable().optional(),
}).refine(
  (data) => {
    // Validate that end_date is after start_date if both are provided
    if (data.start_date && data.end_date) {
      return new Date(data.end_date) > new Date(data.start_date);
    }
    return true;
  },
  {
    message: "End date must be after start date",
    path: ["end_date"],
  }
);
