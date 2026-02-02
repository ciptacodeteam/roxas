/**
 * Coupons API Client
 * Handles HTTP requests for coupon management
 */

import type {
  Coupon,
  CreateCouponRequest,
  UpdateCouponRequest,
  CouponListParams,
  PaginatedResponse,
} from "./types";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export class CouponsApiError extends Error {
  constructor(
    message: string,
    public errors?: Record<string, string[]>
  ) {
    super(message);
    this.name = "CouponsApiError";
  }
}

/**
 * Get all coupons with optional filters
 */
export async function getCoupons(
  params?: CouponListParams
): Promise<Coupon[]> {
  const queryParams = new URLSearchParams();
  
  if (params?.search) queryParams.append("search", params.search);
  if (params?.is_active !== undefined) queryParams.append("is_active", String(params.is_active));
  if (params?.page) queryParams.append("page", String(params.page));
  if (params?.page_size) queryParams.append("page_size", String(params.page_size));

  const response = await fetch(
    `${API_BASE_URL}/api/v1/admin/coupons/?${queryParams}`,
    {
      method: "GET",
      credentials: "include",
    }
  );

  if (!response.ok) {
    throw new CouponsApiError("Failed to fetch coupons");
  }

  const data = await response.json();
  
  // Handle paginated response from Django REST Framework
  if (data && typeof data === 'object' && 'results' in data) {
    return data.results;
  }
  
  // Handle non-paginated response (array)
  return data;
}

/**
 * Get single coupon by ID
 */
export async function getCoupon(id: string): Promise<Coupon> {
  const response = await fetch(
    `${API_BASE_URL}/api/v1/admin/coupons/${id}/`,
    {
      method: "GET",
      credentials: "include",
    }
  );

  if (!response.ok) {
    if (response.status === 404) {
      throw new CouponsApiError("Coupon not found");
    }
    throw new CouponsApiError("Failed to fetch coupon");
  }

  return response.json();
}

/**
 * Create new coupon
 */
export async function createCoupon(
  data: CreateCouponRequest
): Promise<Coupon> {
  const response = await fetch(`${API_BASE_URL}/api/v1/admin/coupons/`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({
      detail: "Failed to create coupon",
    }));
    throw new CouponsApiError(
      error.detail || "Failed to create coupon",
      error.errors
    );
  }

  return response.json();
}

/**
 * Update existing coupon
 */
export async function updateCoupon(
  id: string,
  data: UpdateCouponRequest
): Promise<Coupon> {
  const response = await fetch(`${API_BASE_URL}/api/v1/admin/coupons/${id}/`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({
      detail: "Failed to update coupon",
    }));
    throw new CouponsApiError(
      error.detail || "Failed to update coupon",
      error.errors
    );
  }

  return response.json();
}

/**
 * Delete coupon
 */
export async function deleteCoupon(id: string): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/api/v1/admin/coupons/${id}/`, {
    method: "DELETE",
    credentials: "include",
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({
      detail: "Failed to delete coupon",
    }));
    throw new CouponsApiError(
      error.detail || "Failed to delete coupon",
      error.errors
    );
  }
}
/**
 * Validate a coupon code for an order
 */
export async function validateCoupon(params: {
  code: string;
  order_amount: number;
  user_id?: string;
}): Promise<{
  valid: boolean;
  error?: string;
  coupon?: Coupon;
  discount_amount?: number;
  final_amount?: number;
}> {
  const response = await fetch(`${API_BASE_URL}/api/v1/coupons/validate/`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(params),
  });

  const data = await response.json();
  return data;
}

/**
 * Get applicable coupons for an order
 */
export async function getApplicableCoupons(params: {
  order_amount: number;
  user_id?: string;
}): Promise<{
  coupons: Coupon[];
  applicable_ids: string[];
}> {
  const response = await fetch(`${API_BASE_URL}/api/v1/coupons/applicable/`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(params),
  });

  if (!response.ok) {
    throw new CouponsApiError("Failed to fetch applicable coupons");
  }

  return response.json();
}