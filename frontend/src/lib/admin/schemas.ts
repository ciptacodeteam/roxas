/**
 * Admin Validation Schemas
 * Zod schemas for form validation
 */

import { z } from "zod";

export const updateProfileSchema = z.object({
  full_name: z.string().min(1, "Name is required").max(100, "Name is too long"),
  contact_phone: z.string().optional(),
});

export const changePasswordSchema = z
  .object({
    old_password: z.string().min(1, "Current password is required"),
    new_password: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.new_password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export type UpdateProfileFormData = z.infer<typeof updateProfileSchema>;
export type ChangePasswordFormData = z.infer<typeof changePasswordSchema>;
