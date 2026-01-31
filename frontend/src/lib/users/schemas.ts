/**
 * Users Validation Schemas
 * Zod schemas for form validation
 */

import { z } from "zod";

export const createUserSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  full_name: z.string().min(1, "Full name is required").max(255, "Name is too long"),
  contact_phone: z.string().optional(),
  role: z.enum(["STAFF", "CUSTOMER"], {
    message: "Please select a valid role",
  }),
});

export const updateUserSchema = z.object({
  full_name: z.string().min(1, "Full name is required").max(255, "Name is too long").optional(),
  contact_phone: z.string().optional(),
});

export type CreateUserFormData = z.infer<typeof createUserSchema>;
export type UpdateUserFormData = z.infer<typeof updateUserSchema>;
