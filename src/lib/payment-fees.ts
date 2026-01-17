import type { PaymentMethod } from "@prisma/client";
import { FeeType } from "@prisma/client";

/**
 * Calculate payment fee based on payment method configuration
 */
export function calculatePaymentFee(
  amount: number,
  paymentMethod: Pick<PaymentMethod, "feeType" | "feeValue">
): number {
  if (paymentMethod.feeType === FeeType.PERCENTAGE) {
    return Math.round((amount * paymentMethod.feeValue) / 100);
  } else {
    // FIXED
    return Math.round(paymentMethod.feeValue);
  }
}

/**
 * Calculate VAT on payment fee
 */
export function calculateVAT(
  feeAmount: number,
  paymentMethod: Pick<PaymentMethod, "vatType" | "vatValue">
): number {
  if (paymentMethod.vatType === FeeType.PERCENTAGE) {
    return Math.round((feeAmount * paymentMethod.vatValue) / 100);
  } else {
    // FIXED
    return Math.round(paymentMethod.vatValue);
  }
}

/**
 * Calculate total amount including payment fee and VAT
 */
export function calculateTotalWithFees(
  baseAmount: number,
  paymentMethod: Pick<PaymentMethod, "feeType" | "feeValue" | "vatType" | "vatValue">
): {
  baseAmount: number;
  paymentFee: number;
  vatAmount: number;
  totalAmount: number;
} {
  const paymentFee = calculatePaymentFee(baseAmount, paymentMethod);
  const vatAmount = calculateVAT(paymentFee, paymentMethod);
  const totalAmount = baseAmount + paymentFee + vatAmount;

  return {
    baseAmount,
    paymentFee,
    vatAmount,
    totalAmount,
  };
}

