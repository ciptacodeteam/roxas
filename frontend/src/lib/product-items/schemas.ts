import { z } from "zod";

export const CreateProductItemSchema = z.object({
    product: z.string().min(1, "Product is required"),
    name: z.string().min(1, "Name is required"),
    sku_code: z.string().min(1, "SKU code is required"),
    icon_image: z.union([
        z.instanceof(File),
        z.string(),
        z.null()
    ]).optional(),
    group: z.string().optional(),
    base_price: z.number().min(0, "Base price must be non-negative"),
    normal_price: z.number().min(0, "Normal price must be non-negative"),
    discounted_price: z.number().min(0, "Discounted price must be non-negative").nullable().optional(),
    sell_price: z.number().min(0, "Sell price must be non-negative"),
    is_active: z.boolean().optional(),
    sort_order: z.number().optional(),
});

export const UpdateProductItemSchema = z.object({
    product: z.string().min(1).optional(),
    name: z.string().min(1).optional(),
    sku_code: z.string().min(1).optional(),
    icon_image: z.union([
        z.instanceof(File),
        z.string(),
        z.null()
    ]).optional(),
    group: z.string().optional(),
    base_price: z.number().min(0).optional(),
    normal_price: z.number().min(0).optional(),
    discounted_price: z.number().min(0).nullable().optional(),
    sell_price: z.number().min(0).optional(),
    is_active: z.boolean().optional(),
    sort_order: z.number().optional(),
});

export const SyncPricesSchema = z.object({
    type: z.enum(['PREPAID', 'PASCA', 'FULL']).optional(),
    category: z.string().optional(),
    brand: z.string().optional(),
});

export type CreateProductItemInput = z.infer<typeof CreateProductItemSchema>;
export type UpdateProductItemInput = z.infer<typeof UpdateProductItemSchema>;
export type SyncPricesInput = z.infer<typeof SyncPricesSchema>;
