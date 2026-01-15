import { env } from "@/env";
import crypto from "crypto";

/**
 * Midtrans payment integration utilities
 * Documentation: https://docs.midtrans.com/
 */

const MIDTRANS_BASE_URL = env.MIDTRANS_IS_PRODUCTION === "true"
  ? "https://api.midtrans.com"
  : "https://api.sandbox.midtrans.com";

const MIDTRANS_SNAP_URL = env.MIDTRANS_IS_PRODUCTION === "true"
  ? "https://app.midtrans.com"
  : "https://app.sandbox.midtrans.com";

/**
 * Generate order ID for Midtrans
 */
export function generateOrderId(orderNumber: string): string {
  return orderNumber;
}

/**
 * Create Snap payment token
 * This will return a token that can be used with Midtrans Snap.js
 */
export async function createSnapTransaction(params: {
  orderId: string;
  grossAmount: number;
  customerDetails: {
    firstName: string;
    lastName?: string;
    email: string;
    phone?: string;
  };
  itemDetails: Array<{
    id: string;
    price: number;
    quantity: number;
    name: string;
  }>;
  customField1?: string; // Order ID
  customField2?: string; // User ID
}): Promise<{ token: string; redirectUrl: string }> {
  const url = `${MIDTRANS_SNAP_URL}/snap/v1/transactions`;

  const payload = {
    transaction_details: {
      order_id: params.orderId,
      gross_amount: params.grossAmount,
    },
    customer_details: {
      first_name: params.customerDetails.firstName,
      last_name: params.customerDetails.lastName || "",
      email: params.customerDetails.email,
      phone: params.customerDetails.phone || "",
    },
    item_details: params.itemDetails,
    custom_field1: params.customField1,
    custom_field2: params.customField2,
  };

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      Authorization: `Basic ${Buffer.from(env.MIDTRANS_SERVER_KEY + ":").toString("base64")}`,
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: "Failed to create transaction" }));
    console.error("Midtrans Snap API error response:", {
      status: response.status,
      statusText: response.statusText,
      error,
      url,
    });
    throw new Error(error.message || `Midtrans API error: ${response.status}`);
  }

  const data = await response.json();

  return {
    token: data.token,
    redirectUrl: data.redirect_url,
  };
}

/**
 * Create Core API transaction (for direct payment methods)
 */
export async function createCoreTransaction(params: {
  orderId: string;
  grossAmount: number;
  paymentType: "credit_card" | "bank_transfer" | "echannel" | "gopay" | "shopeepay";
  customerDetails: {
    firstName: string;
    lastName?: string;
    email: string;
    phone?: string;
  };
  itemDetails: Array<{
    id: string;
    price: number;
    quantity: number;
    name: string;
  }>;
  bankTransfer?: {
    bank: "bca" | "bni" | "permata" | "mandiri";
  };
  customField1?: string;
  customField2?: string;
}): Promise<any> {
  const url = `${MIDTRANS_BASE_URL}/v2/charge`;

  console.log("=== MIDTRANS REQUEST ===", {
    url,
    paymentType: params.paymentType,
    orderId: params.orderId,
    amount: params.grossAmount,
  });

  const payload: any = {
    payment_type: params.paymentType,
    transaction_details: {
      order_id: params.orderId,
      gross_amount: params.grossAmount,
    },
    customer_details: {
      first_name: params.customerDetails.firstName,
      last_name: params.customerDetails.lastName || "",
      email: params.customerDetails.email,
      phone: params.customerDetails.phone || "",
    },
    item_details: params.itemDetails,
    custom_field1: params.customField1,
    custom_field2: params.customField2,
  };

  // Add payment-specific parameters
  if (params.paymentType == "bank_transfer" && params.bankTransfer) {
    payload.bank_transfer = {
      bank: params.bankTransfer.bank,
    };
  }

  console.log("=== MIDTRANS PAYLOAD ===", JSON.stringify(payload, null, 2));

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      Authorization: `Basic ${Buffer.from(env.MIDTRANS_SERVER_KEY + ":").toString("base64")}`,
    },
    body: JSON.stringify(payload),
  });

  console.log("=== MIDTRANS HTTP RESPONSE ===", {
    status: response.status,
    statusText: response.statusText,
    ok: response.ok,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: "Failed to create transaction" }));
    throw new Error(error.message || `Midtrans API error: ${response.status}`);
  }

  return await response.json();
}

/**
 * Get transaction status
 */
export async function getTransactionStatus(orderId: string): Promise<any> {
  const url = `${MIDTRANS_BASE_URL}/v2/${orderId}/status`;

  const response = await fetch(url, {
    method: "GET",
    headers: {
      Accept: "application/json",
      Authorization: `Basic ${Buffer.from(env.MIDTRANS_SERVER_KEY + ":").toString("base64")}`,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: "Failed to get transaction status" }));
    throw new Error(error.message || `Midtrans API error: ${response.status}`);
  }

  return await response.json();
}

/**
 * Verify webhook signature
 * Midtrans sends webhook with signature in headers
 */
export function verifyWebhookSignature(
  orderId: string,
  statusCode: string,
  grossAmount: string,
  signatureKey: string
): boolean {
  const expectedSignature = crypto
    .createHash("sha512")
    .update(orderId + statusCode + grossAmount + env.MIDTRANS_SERVER_KEY)
    .digest("hex");

  return signatureKey === expectedSignature;
}

import { PaymentStatus } from "@prisma/client";

/**
 * Map Midtrans status to our payment status
 */
export function mapMidtransStatus(midtransStatus: string): {
  status: PaymentStatus;
  isPaid: boolean;
} {
  const statusMap: Record<string, { status: PaymentStatus; isPaid: boolean }> = {
    pending: { status: PaymentStatus.PENDING, isPaid: false },
    settlement: { status: PaymentStatus.SETTLEMENT, isPaid: true },
    capture: { status: PaymentStatus.SETTLEMENT, isPaid: true },
    authorize: { status: PaymentStatus.PENDING, isPaid: false },
    deny: { status: PaymentStatus.DENY, isPaid: false },
    expire: { status: PaymentStatus.EXPIRE, isPaid: false },
    cancel: { status: PaymentStatus.CANCEL, isPaid: false },
    refund: { status: PaymentStatus.REFUND, isPaid: false },
    partial_refund: { status: PaymentStatus.REFUND, isPaid: false },
    chargeback: { status: PaymentStatus.REFUND, isPaid: false },
  };

  return statusMap[midtransStatus.toLowerCase()] || { status: PaymentStatus.PENDING, isPaid: false };
}

