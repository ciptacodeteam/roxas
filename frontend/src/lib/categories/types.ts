export interface Category {
    id: string;
    name: string;
    slug: string;
    is_active: boolean;
    sort_order: number;
    created_at: string;
    updated_at: string;
}

export interface CategoryWithCount extends Category {
    product_count: number;
    instruction_images: Array<{
        id: string;
        url: string;
        sort_order: number;
    }>;
}

export type CreateCategoryRequest = Omit<Category, "id" | "created_at" | "updated_at">;
export type UpdateCategoryRequest = Partial<CreateCategoryRequest>;
