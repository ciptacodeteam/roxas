import { env } from "@/env";

const API_BASE_URL = env.NEXT_PUBLIC_BACKEND_API_URL || "http://localhost:8000";

// ==================== TYPES ====================

export interface Order {
  id: string;
  order_number: string;
  product_item_name: string;
  total_amount: number;
  payment_method_name: string | null;
  status: OrderStatus;
  created_at: string;
}

export type OrderStatus =
  | "PENDING"
  | "PAID"
  | "PROCESSING"
  | "COMPLETED"
  | "FAILED"
  | "REFUNDED"
  | "EXPIRED";

export interface OrderFilters {
  status?: OrderStatus;
  search?: string;
  page?: number;
  page_size?: number;
}

export interface OrderListResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: Order[];
}

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
 * Get single order details
 */
export async function getOrderDetailsApi(orderId: string): Promise<Order> {
  const response = await fetch(`${API_BASE_URL}/api/v1/orders/${orderId}/`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.detail || "Failed to fetch order details");
  }

  return response.json();
}
