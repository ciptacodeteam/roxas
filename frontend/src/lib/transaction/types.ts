/**
 * Transaction/Order Type Definitions
 * Matches backend OrderSerializer and PaymentSerializer
 */

// ==================== ORDER TYPES ====================

export type OrderStatus =
  | "PENDING"
  | "PAID"
  | "PROCESSING"
  | "COMPLETED"
  | "FAILED"
  | "REFUNDED"
  | "EXPIRED";

export type PaymentStatus =
  | "PENDING"
  | "SETTLEMENT"
  | "SUCCESS"
  | "FAILED"
  | "EXPIRED"
  | "REFUNDED"
  | "CANCEL"
  | "DENY";

export type PaymentType =
  | "QRIS"
  | "BANK_TRANSFER"
  | "E_WALLET"
  | "CREDIT_CARD";

/**
 * Customer data stored in order
 */
export interface CustomerData {
  userId?: string;
  serverId?: string;
  zoneId?: string;
  phoneNumber?: string;
  meterNumber?: string;
  email?: string;
  phone?: string;
  [key: string]: any;
}

/**
 * Payment details for an order
 */
export interface PaymentDetail {
  id: string;
  external_id: string;
  transaction_id: string | null;
  payment_method: {
    name: string;
    type: PaymentType;
  } | null;
  amount: number;
  status: PaymentStatus;
  payment_url: string | null;
  va_number: string | null;
  qris_string: string | null;
  deeplink_url: string | null;
  redirect_url: string | null;
  expires_at: string | null;
  paid_at: string | null;
  created_at: string;
}

/**
 * Digiflazz transaction details
 */
export interface DigiflazzTransaction {
  ref_id: string;
  trx_id: string;
  status: "Pending" | "Sukses" | "Gagal" | "Expired";
  message: string;
  serial_number: string;
  sku_code: string;
  customer_no: string;
  created_at: string;
  updated_at: string;
}

/**
 * Detailed order information
 */
export interface OrderDetail {
  id: string;
  order_number: string;
  user_email: string;
  product_item_name: string;
  customer_data: CustomerData;
  original_price: number;
  final_price: number;
  payment_fee: number;
  vat_amount: number;
  total_amount: number;
  payment_method_name: string;
  payment_expires_at: string | null;
  status: OrderStatus;
  refund_amount: number | null;
  refund_reason: string | null;
  refunded_at: string | null;
  created_at: string;
  updated_at: string;
  paid_at: string | null;
  completed_at: string | null;
  payment?: PaymentDetail;
  digiflazz_transaction?: DigiflazzTransaction;
}

/**
 * Simplified order for list view
 */
export interface Order {
  id: string;
  order_number: string;
  product_item_name: string;
  total_amount: number;
  payment_method_name: string | null;
  status: OrderStatus;
  created_at: string;
}

// ==================== API REQUEST/RESPONSE TYPES ====================

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

// ==================== UTILITY TYPES ====================

export interface OrderStatusInfo {
  label: string;
  color: string;
  icon: string;
  description: string;
}

export interface PaymentStatusInfo {
  label: string;
  color: string;
  icon: string;
}
