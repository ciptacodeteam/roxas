export interface Product {
    id: string;
    category: string | { id: string; name: string; slug: string; product_count: number };
    category_name: string;
    category_details?: {
        id: string;
        name: string;
        slug: string;
        instruction_images: Array<{
            id: string;
            image: string | null;
            alt_text: string;
            sort_order: number;
        }>;
    };
    name: string;
    slug: string;
    description: string;
    image: string | null;
    banner_image: string | null;
    input_fields: any[];
    instructions: string;
    is_active: boolean;
    sort_order: number;
    created_at: string;
    updated_at: string;
}

export interface ProductWithItems extends Product {
    items: ProductItem[];
}

export interface ProductItem {
    id: string;
    product: string;
    name: string;
    sku_code: string;
    icon_image: string | null;
    group: string;
    base_price: number;
    normal_price: number;
    discounted_price: number;
    sell_price: number;
    is_active: boolean;
    sort_order: number;
    created_at: string;
    updated_at: string;
}

export interface PaginatedProductsResponse {
    results: Product[];
    count: number;
}

export type CreateProductRequest = Omit<Product, "id" | "created_at" | "updated_at" | "category_name"> & {
    category: string;
    image?: File | string | null;
    banner_image?: File | string | null;
};

export type UpdateProductRequest = Partial<CreateProductRequest>;
