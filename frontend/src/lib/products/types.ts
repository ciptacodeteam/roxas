export interface Product {
    id: string;
    category: {
        id: string;
        name: string;
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
    buy_price: number;
    sell_price: number;
    profit_margin: number;
    is_active: boolean;
    sort_order: number;
    stock_status: 'available' | 'limited' | 'out_of_stock';
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
