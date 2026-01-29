/**
 * Flash Sales Validation Schemas
 * Zod schemas for form validation
 */

import { z } from "zod";

export const CreateFlashSaleSchema = z.object({
    name: z.string().min(1, "Flash sale name is required").max(200, "Name must be 200 characters or less"),
    start_time: z.string().datetime("Invalid date format"),
    end_time: z.string().datetime("Invalid date format"),
    is_active: z.boolean().optional().default(true),
}).refine(
    (data) => new Date(data.end_time) > new Date(data.start_time),
    {
        message: "End time must be after start time",
        path: ["end_time"],
    }
);

export const UpdateFlashSaleSchema = z.object({
    name: z.string().min(1, "Flash sale name is required").max(200, "Name must be 200 characters or less").optional(),
    start_time: z.string().datetime("Invalid date format").optional(),
    end_time: z.string().datetime("Invalid date format").optional(),
    is_active: z.boolean().optional(),
}).refine(
    (data) => {
        // Only validate if both dates are provided
        if (data.start_time && data.end_time) {
            return new Date(data.end_time) > new Date(data.start_time);
        }
        return true;
    },
    {
        message: "End time must be after start time",
        path: ["end_time"],
    }
);

export const CreateFlashSaleItemSchema = z.object({
    flash_sale: z.string().uuid("Invalid flash sale ID"),
    product_item: z.string().uuid("Invalid product item ID"),
    sale_price: z.number().int().min(0, "Sale price must be 0 or greater"),
    stock: z.number().int().min(1, "Stock must be at least 1"),
});

export const UpdateFlashSaleItemSchema = z.object({
    sale_price: z.number().int().min(0, "Sale price must be 0 or greater").optional(),
    stock: z.number().int().min(1, "Stock must be at least 1").optional(),
});

export type CreateFlashSaleInput = z.infer<typeof CreateFlashSaleSchema>;
export type UpdateFlashSaleInput = z.infer<typeof UpdateFlashSaleSchema>;
export type CreateFlashSaleItemInput = z.infer<typeof CreateFlashSaleItemSchema>;
export type UpdateFlashSaleItemInput = z.infer<typeof UpdateFlashSaleItemSchema>;
