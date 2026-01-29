/**
 * Payment Methods Module Types
 * Type definitions for payment method management
 */

export enum PaymentMethodType {
  QRIS = "QRIS",
  E_WALLET = "E_WALLET",
  MOBILE_BANKING = "MOBILE_BANKING",
  CREDIT_CARD = "CREDIT_CARD",
  BANK_TRANSFER = "BANK_TRANSFER",
}

export enum FeeType {
  PERCENTAGE = "PERCENTAGE",
  FIXED = "FIXED",
}

export interface PaymentMethod {
  id: string;
  type: PaymentMethodType;
  name: string;
  description: string;
  icon: string;
  fee_type: FeeType;
  fee_value: number;
  vat_type: FeeType;
  vat_value: number;
  is_active: boolean;
  midtrans_code: string;
  created_at: string;
  updated_at: string;
}

export interface CreatePaymentMethodRequest {
  type: PaymentMethodType;
  name: string;
  description?: string;
  icon?: string | File;
  fee_type?: FeeType;
  fee_value?: number;
  vat_type?: FeeType;
  vat_value?: number;
  is_active?: boolean;
  midtrans_code: string;
}

export interface UpdatePaymentMethodRequest {
  type?: PaymentMethodType;
  name?: string;
  description?: string;
  icon?: string | File;
  fee_type?: FeeType;
  fee_value?: number;
  vat_type?: FeeType;
  vat_value?: number;
  is_active?: boolean;
  midtrans_code?: string;
}

export interface PaymentMethodListParams {
  search?: string;
  is_active?: boolean;
  type?: PaymentMethodType;
  page?: number;
  page_size?: number;
}

export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}
