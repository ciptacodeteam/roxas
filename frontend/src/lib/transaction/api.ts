import { env } from "@/env";
import type { Order, OrderDetail, OrderFilters, OrderListResponse } from "./types";

const API_BASE_URL = env.NEXT_PUBLIC_BACKEND_API_URL || "http://localhost:8000";

// Re-export types for convenience
export type { Order, OrderDetail, OrderFilters, OrderListResponse } from "./types";

// ==================== API FUNCTIONS ====================

/**
 * Get user's orders/transactions
 */
export async function getUserOrdersApi(filters?: OrderFilters): Promise<OrderListResponse> {
  const queryParams = new URLSearchParams();
  
  if (filters?.status) queryParams.set("status", filters.status);
  if (filters?.search) queryParams.set("search", filters.search);
  if (filters?.page) queryParams.set("page", filters.page.toString());
  if (filters?.page_size) queryParams.set("page_size", filters.page_size.toString());

  const url = `${API_BASE_URL}/api/v1/orders/${queryParams.toString() ? `?${queryParams.toString()}` : ""}`;
  
  const response = await fetch(url, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.detail || "Failed to fetch orders");
  }

  return response.json();
}

/**
 * Get single order details with full information
 */
export async function getOrderDetailsApi(orderId: string): Promise<OrderDetail> {
  const response = await fetch(`${API_BASE_URL}/api/v1/orders/${orderId}/`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
  });

  if (!response.ok) {
    if (response.status === 404) {
      throw new Error("Transaction not found");
    }
    const error = await response.json().catch(() => ({}));
    throw new Error(error.detail || "Failed to fetch order details");
  }

  return response.json();
}
