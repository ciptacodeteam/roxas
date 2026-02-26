import { API_URL } from "@/lib/api-url";
import type { Order, OrderDetail, OrderFilters, OrderListResponse } from "./types";

const API_BASE_URL = API_URL;

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

  const data = await response.json();
  
  // Backend already provides product_item_name and payment_method_name
  return data;
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

  const data = await response.json();
  
  // Transform backend response to match frontend OrderDetail interface
  return {
    ...data,
    product_item_name: data.product_item?.product?.name && data.product_item?.name
      ? `${data.product_item.product.name} - ${data.product_item.name}`
      : data.product_item?.name || "Unknown Product",
    payment_method_name: data.payment_method?.name || "Unknown Payment Method",
    coupon_discount: data.coupon_discount ?? null,
    failure_reason: data.failure_reason || null,
    completion_data: data.completion_data ?? null,
    product_rating: data.product_rating ?? null,
    payment: data.payment ? {
      id: data.payment.id,
      external_id: data.payment.external_id,
      transaction_id: data.payment.transaction_id,
      payment_method: data.payment.payment_method ? {
        name: data.payment.payment_method.name,
        type: data.payment.payment_method.type,
      } : null,
      amount: data.payment.amount,
      status: data.payment.status?.toUpperCase() || "PENDING",
      payment_url: data.payment.payment_url,
      va_number: data.payment.va_number,
      qris_string: data.payment.qris_string,
      deeplink_url: data.payment.deeplink_url,
      redirect_url: data.payment.redirect_url,
      expires_at: data.payment.expires_at,
      paid_at: data.payment.paid_at,
      created_at: data.payment.created_at,
    } : undefined,
  };
}
