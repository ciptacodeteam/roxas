import { z } from "zod";

export const InputFieldSchema = z.object({
    key: z.string().min(1, "Field key is required"),
    label: z.string().min(1, "Field label is required"),
    type: z.enum(["text", "number", "email", "tel"]),
    placeholder: z.string().optional(),
    hint: z.string().optional(),
    required: z.boolean().optional().default(true),
    validation: z.object({
        pattern: z.string().optional(),
        min_length: z.number().optional(),
        max_length: z.number().optional(),
    }).optional(),
});

export const CreateProductSchema = z.object({
    name: z.string().min(1, "Product name is required"),
    slug: z.string().min(1, "Slug is required"),
    category: z.string().uuid("Valid category is required"),
    description: z.string().optional().default(""),
    image: z.string().optional().nullable(),
    banner_image: z.string().optional().nullable(),
    input_fields: z.array(InputFieldSchema).default([]),
    customer_no_template: z.string().optional().default(""),
    supports_validation: z.boolean().optional().default(false),
    instructions: z.string().optional().default(""),
    is_active: z.boolean().default(true),
    sort_order: z.number().int().default(0),
});

export const UpdateProductSchema = CreateProductSchema.partial();

export type CreateProductInput = z.infer<typeof CreateProductSchema>;
export type UpdateProductInput = z.infer<typeof UpdateProductSchema>;
export type InputFieldInput = z.infer<typeof InputFieldSchema>;
