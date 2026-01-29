import { z } from "zod";

export const InputFieldSchema = z.object({
    name: z.string().min(1, "Field name is required"),
    label: z.string().min(1, "Field label is required"),
    type: z.enum(["text", "number", "email", "tel"]),
    placeholder: z.string().optional(),
    required: z.boolean().optional().default(true),
});

export const CreateProductSchema = z.object({
    name: z.string().min(1, "Product name is required"),
    slug: z.string().min(1, "Slug is required"),
    category: z.string().uuid("Valid category is required"),
    description: z.string().optional().default(""),
    image: z.string().optional().nullable(),
    banner_image: z.string().optional().nullable(),
    input_fields: z.array(InputFieldSchema).default([]),
    instructions: z.string().optional().default(""),
    is_active: z.boolean().default(true),
    sort_order: z.number().int().default(0),
});

export const UpdateProductSchema = CreateProductSchema.partial();

export type CreateProductInput = z.infer<typeof CreateProductSchema>;
export type UpdateProductInput = z.infer<typeof UpdateProductSchema>;
export type InputFieldInput = z.infer<typeof InputFieldSchema>;
