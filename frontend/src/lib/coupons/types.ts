/**
 * Coupons Module Types
 * Type definitions for coupon management
 */

export enum DiscountType {
  PERCENTAGE = "PERCENTAGE",
  FIXED_AMOUNT = "FIXED_AMOUNT",
}

export interface Coupon {
  id: string;
  code: string;
  description: string;
  discount_type: DiscountType;
  discount_value: number;
  min_purchase: number;
  max_discount: number | null;
  usage_limit: number | null;
  usage_count: number;
  user_limit: number | null;
  is_active: boolean;
  start_date: string | null;
  end_date: string | null;
  is_valid: boolean;
  created_at: string;
  updated_at: string;
  // Optional fields returned by backend in detail view
  _count?: {
    usages: number;
  };
  usages?: Array<{
    id: string;
    user_id: string;
    order_id: string;
    discount_amount: number;
    created_at: string;
    user: {
      id: string;
      email: string;
      name: string | null;
    };
    order: {
      id: string;
      order_number: string;
      final_price: number;
    };
  }>;
}

export interface CreateCouponRequest {
  code: string;
  description?: string;
  discount_type: DiscountType;
  discount_value: number;
  min_purchase?: number;
  max_discount?: number | null;
  usage_limit?: number | null;
  user_limit?: number | null;
  is_active?: boolean;
  start_date?: string | null;
  end_date?: string | null;
}

export interface UpdateCouponRequest {
  code?: string;
  description?: string;
  discount_type?: DiscountType;
  discount_value?: number;
  min_purchase?: number;
  max_discount?: number | null;
  usage_limit?: number | null;
  user_limit?: number | null;
  is_active?: boolean;
  start_date?: string | null;
  end_date?: string | null;
}

export interface CouponListParams {
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
