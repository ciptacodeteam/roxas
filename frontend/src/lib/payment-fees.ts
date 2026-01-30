/**
 * Payment fee calculation utilities
 * Based on Django backend payment fee logic
 */

export interface PaymentMethod {
  id: number;
  type: string;
  name: string;
  description?: string;
  icon?: string;
  fee_type: 'PERCENTAGE' | 'FIXED';
  fee_value: number;
  vat_type: 'PERCENTAGE' | 'FIXED';
  vat_value: number;
}

export interface FeeCalculation {
  paymentFee: number;
  vatAmount: number;
  totalAmount: number;
}

/**
 * Calculate payment fees and VAT based on payment method configuration
 * 
 * @param baseAmount - The base amount before fees (final_price after discounts)
 * @param paymentMethod - The payment method configuration
 * @returns Object containing payment fee, VAT amount, and total amount
 */
export function calculateTotalWithFees(
  baseAmount: number,
  paymentMethod: PaymentMethod | null | undefined
): FeeCalculation {
  if (!paymentMethod) {
    return {
      paymentFee: 0,
      vatAmount: 0,
      totalAmount: baseAmount,
    };
  }

  // Calculate payment fee
  let paymentFee: number;
  if (paymentMethod.fee_type === 'PERCENTAGE') {
    paymentFee = Math.floor((baseAmount * paymentMethod.fee_value) / 100);
  } else {
    // FIXED
    paymentFee = Math.floor(paymentMethod.fee_value);
  }

  // Calculate VAT on the payment fee
  let vatAmount: number;
  if (paymentMethod.vat_type === 'PERCENTAGE') {
    vatAmount = Math.floor((paymentFee * paymentMethod.vat_value) / 100);
  } else {
    // FIXED
    vatAmount = Math.floor(paymentMethod.vat_value);
  }

  // Calculate total: base amount + payment fee + VAT
  const totalAmount = baseAmount + paymentFee + vatAmount;

  return {
    paymentFee,
    vatAmount,
    totalAmount,
  };
}
