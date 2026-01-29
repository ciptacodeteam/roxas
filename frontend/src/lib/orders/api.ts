/**
 * Orders API Client
 * Handles HTTP requests to Django backend for orders management
 */

import type { Order } from "./types";
import { OrdersApiError } from "./types";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

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
        throw new OrdersApiError(
            error.message || error.detail || "Request failed",
            error
        ) as OrdersApiError;
    }

    return response.json();
}

/**
 * Get all orders
 */
export async function getOrders(filters?: { status?: string }): Promise<Order[]> {
    const queryParams = new URLSearchParams();
    if (filters?.status && filters.status !== "all") {
        queryParams.set("status", filters.status);
    }

    const url = `/api/admin/orders${queryParams.toString() ? `?${queryParams.toString()}` : ""}`;
    return fetchAPI<Order[]>(url);
}

/**
 * Get single order by ID
 */
export async function getOrder(id: string): Promise<Order> {
    return fetchAPI<Order>(`/api/admin/orders/${id}`);
}
