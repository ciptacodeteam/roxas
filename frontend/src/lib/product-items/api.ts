/**
 * Product Items API Client
 * Handles HTTP requests to Django backend for product items management
 */

import type {
    ProductItem,
    ProductItemWithProduct,
    CreateProductItemRequest,
    UpdateProductItemRequest,
    SyncPricesRequest,
    SyncPricesResponse,
    SyncStatus,
} from "./types";

import { ProductItemsApiError } from "./types";
import { API_URL } from "@/lib/api-url";

const API_BASE_URL = API_URL;

/**
 * Fetch wrapper with error handling
 */
async function fetchAPI<T>(
    endpoint: string,
    options?: RequestInit
): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;

    const response = await fetch(url, {
        credentials: "include",
        headers: {
            ...options?.headers,
        },
        ...options,
    });

    if (!response.ok) {
        const error = await response.json().catch(() => ({
            message: `HTTP ${response.status}: ${response.statusText}`,
        }));
        throw new ProductItemsApiError(
            error.message || error.detail || "Request failed",
            error
        ) as ProductItemsApiError;
    }

    return response.json();
}

/**
 * Get all product items (use sparingly - fetches all pages)
 */
export async function getProductItems(): Promise<ProductItem[]> {
    try {
        let allItems: ProductItem[] = [];
        let nextUrl: string | null = "/api/v1/admin/product-items/";

        // Fetch all pages
        while (nextUrl) {
            const response = await fetchAPI<any>(nextUrl);

            // Handle both paginated and non-paginated responses
            if (Array.isArray(response)) {
                allItems = response;
                break;
            }

            // If it's an object with results, collect the results
            if (response && response.results && Array.isArray(response.results)) {
                allItems = [...allItems, ...response.results];

                // Check if there's a next page
                if (response.next) {
                    // Extract the path from the full URL
                    const url = new URL(response.next);
                    nextUrl = url.pathname + url.search;
                } else {
                    nextUrl = null;
                }
            } else {
                break;
            }
        }

        return allItems;
    } catch (error) {
        console.error("Error fetching product items:", error);
        return [];
    }
}

/**
 * Search product items with server-side filtering
 * This is optimized for dropdown/combobox search - only fetches matching items
 */
export async function searchProductItems(query: string, limit: number = 50): Promise<ProductItem[]> {
    if (!query || query.length < 2) {
        return [];
    }

    try {
        const searchParams = new URLSearchParams({
            search: query,
            page_size: limit.toString(),
        });

        const response = await fetchAPI<any>(`/api/v1/admin/product-items/?${searchParams.toString()}`);

        // Handle both paginated and non-paginated responses
        if (Array.isArray(response)) {
            return response.slice(0, limit);
        }

        if (response && response.results && Array.isArray(response.results)) {
            return response.results.slice(0, limit);
        }

        return [];
    } catch (error) {
        console.error("Error searching product items:", error);
        return [];
    }
}

/**
 * Get single product item by ID
 */
export async function getProductItem(id: string): Promise<ProductItemWithProduct> {
    return fetchAPI<ProductItemWithProduct>(`/api/v1/admin/product-items/${id}/`);
}

/**
 * Create new product item
 */
export async function createProductItem(
    data: CreateProductItemRequest
): Promise<ProductItem> {
    const hasFile = data.icon_image instanceof File;

    let body: BodyInit;
    let headers: HeadersInit = {};

    if (hasFile) {
        const formData = new FormData();
        Object.entries(data).forEach(([key, value]) => {
            if (value !== undefined && value !== null) {
                if (value instanceof File) {
                    formData.append(key, value);
                } else if (typeof value === 'object') {
                    formData.append(key, JSON.stringify(value));
                } else {
                    formData.append(key, String(value));
                }
            }
        });
        body = formData;
        // Don't set Content-Type, browser will set it with boundary
    } else {
        headers["Content-Type"] = "application/json";
        body = JSON.stringify(data);
    }

    return fetchAPI<ProductItem>("/api/v1/admin/product-items/", {
        method: "POST",
        headers,
        body,
    });
}

/**
 * Update existing product item
 */
export async function updateProductItem(
    id: string,
    data: UpdateProductItemRequest
): Promise<ProductItem> {
    const hasFile = data.icon_image instanceof File;

    let body: BodyInit;
    let headers: HeadersInit = {};

    if (hasFile) {
        const formData = new FormData();
        Object.entries(data).forEach(([key, value]) => {
            if (value !== undefined && value !== null) {
                if (value instanceof File) {
                    formData.append(key, value);
                } else if (typeof value === 'object') {
                    formData.append(key, JSON.stringify(value));
                } else {
                    formData.append(key, String(value));
                }
            }
        });
        body = formData;
        // Don't set Content-Type, browser will set it with boundary
    } else {
        headers["Content-Type"] = "application/json";
        body = JSON.stringify(data);
    }

    return fetchAPI<ProductItem>(`/api/v1/admin/product-items/${id}/`, {
        method: "PATCH",
        headers,
        body,
    });
}

/**
 * Delete product item
 */
export async function deleteProductItem(id: string): Promise<void> {
    if (!id) {
        throw new Error("Product item ID is required");
    }

    try {
        await fetchAPI<void>(`/api/v1/admin/product-items/${id}/`, {
            method: "DELETE",
        });
    } catch (error) {
        if (error instanceof ProductItemsApiError) {
            throw error;
        }
        throw new ProductItemsApiError(
            error instanceof Error ? error.message : "Failed to delete product item",
            error
        );
    }
}

/**
 * Sync prices from Digiflazz
 */
export async function syncPrices(
    data?: SyncPricesRequest
): Promise<SyncPricesResponse> {
    return fetchAPI<SyncPricesResponse>("/api/v1/admin/product-items/sync-prices/", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(data || {}),
    });
}

/**
 * Get sync status
 */
export async function getSyncStatus(): Promise<SyncStatus> {
    return fetchAPI<SyncStatus>("/api/v1/admin/product-items/sync-status/");
}

// Re-export ProductItemsApiError for use in other modules
export { ProductItemsApiError };
