/**
 * Product Items Type Definitions
 */

export interface ProductItem {
    id: string;
    product: string; // product ID
    product_name?: string;
    name: string;
    sku_code: string;
    icon_image: string | null;
    group: string;
    base_price: number;
    normal_price: number;
    discounted_price: number | null;
    sell_price: number;
    is_active: boolean;
    sort_order: number;
    last_synced_at: string | null;
    digiflazz_status: 'ACTIVE' | 'INACTIVE' | null;
    created_at: string;
    updated_at: string;
    product_details?: {
        id: string;
        name: string;
        category_name: string;
    };
}

export interface ProductItemWithProduct extends ProductItem {
    product_details: {
        id: string;
        name: string;
        slug: string;
        category_name: string;
    };
}

export interface CreateProductItemRequest {
    product: string;
    name: string;
    sku_code: string;
    icon_image?: File | string | null;
    group?: string;
    base_price: number;
    normal_price: number;
    discounted_price?: number | null;
    sell_price: number;
    is_active?: boolean;
    sort_order?: number;
}

export interface UpdateProductItemRequest {
    product?: string;
    name?: string;
    sku_code?: string;
    icon_image?: File | string | null;
    group?: string;
    base_price?: number;
    normal_price?: number;
    discounted_price?: number | null;
    sell_price?: number;
    is_active?: boolean;
    sort_order?: number;
}

export interface SyncPricesRequest {
    type?: 'PREPAID' | 'PASCA' | 'FULL';
    category?: string;
    brand?: string;
}

export interface SyncPricesResponse {
    success: boolean;
    message: string;
    result?: {
        itemsUpdated: number;
        itemsCreated: number;
        itemsFailed: number;
        syncedAt: string;
    };
}

export interface SyncStatus {
    is_syncing: boolean;
    last_synced_at: string | null;
    sync_status: 'SUCCESS' | 'FAILED' | 'IN_PROGRESS' | null;
    sync_message: string | null;
}

export class ProductItemsApiError extends Error {
    details?: unknown;

    constructor(message: string, details?: unknown) {
        super(message);
        this.name = "ProductItemsApiError";
        this.details = details;
    }
}
