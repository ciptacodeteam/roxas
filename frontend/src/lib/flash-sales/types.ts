/**
 * Flash Sales Module Types
 * Type definitions for flash sale management
 */

export interface ProductItemRef {
    id: string;
    name: string;
    sku_code: string;
    normal_price: number;
    sell_price: number;
    product: {
        id: string;
        name: string;
        slug: string;
    };
}

export interface FlashSaleItem {
    id: string;
    flash_sale: string;
    product_item: string;
    product_item_name: string;
    product_name: string;
    sale_price: number;
    normal_price: number;
    discount_percentage: number;
    stock: number;
    sold_count: number;
}

export interface FlashSale {
    id: string;
    name: string;
    start_time: string;
    end_time: string;
    is_active: boolean;
    is_active_now: boolean;
    items: FlashSaleItem[];
    created_at: string;
    updated_at: string;
}

export interface CreateFlashSaleRequest {
    name: string;
    start_time: string;
    end_time: string;
    is_active?: boolean;
}

export interface UpdateFlashSaleRequest {
    name?: string;
    start_time?: string;
    end_time?: string;
    is_active?: boolean;
}

export interface CreateFlashSaleItemRequest {
    flash_sale: string;
    product_item: string;
    sale_price: number;
    stock: number;
}

export interface UpdateFlashSaleItemRequest {
    sale_price?: number;
    stock?: number;
}

export interface FlashSaleListParams {
    search?: string;
    is_active?: boolean;
    page?: number;
    page_size?: number;
}

export interface PaginatedResponse<T> {
    count: number;
    next: string | null;
    previous: string | null;
    results: T[];
}
