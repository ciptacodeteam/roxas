/**
 * Payment Methods Validation Schemas
 * Zod schemas for form validation
 */

import { z } from "zod";
import { PaymentMethodType, FeeType } from "./types";

export const createPaymentMethodSchema = z.object({
  type: z.nativeEnum(PaymentMethodType, {
    required_error: "Payment type is required",
  }),
  name: z.string().min(1, "Name is required").max(100, "Name must be less than 100 characters"),
  description: z.string().optional(),
  icon: z.string().optional(),
  fee_type: z.nativeEnum(FeeType).optional().default(FeeType.PERCENTAGE),
  fee_value: z.number().min(0, "Fee value must be 0 or greater").optional().default(0),
  vat_type: z.nativeEnum(FeeType).optional().default(FeeType.PERCENTAGE),
  vat_value: z.number().min(0, "VAT value must be 0 or greater").optional().default(0),
  is_active: z.boolean().optional().default(true),
  midtrans_code: z.string().min(1, "Midtrans code is required").max(50, "Midtrans code must be less than 50 characters"),
});

export const updatePaymentMethodSchema = z.object({
  type: z.nativeEnum(PaymentMethodType).optional(),
  name: z.string().min(1, "Name is required").max(100, "Name must be less than 100 characters").optional(),
  description: z.string().optional(),
  icon: z.string().optional(),
  fee_type: z.nativeEnum(FeeType).optional(),
  fee_value: z.number().min(0, "Fee value must be 0 or greater").optional(),
  vat_type: z.nativeEnum(FeeType).optional(),
  vat_value: z.number().min(0, "VAT value must be 0 or greater").optional(),
  is_active: z.boolean().optional(),
  midtrans_code: z.string().min(1, "Midtrans code is required").max(50, "Midtrans code must be less than 50 characters").optional(),
});

export type CreatePaymentMethodFormData = z.infer<typeof createPaymentMethodSchema>;
export type UpdatePaymentMethodFormData = z.infer<typeof updatePaymentMethodSchema>;
