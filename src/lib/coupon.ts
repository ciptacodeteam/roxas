import { db } from "@/server/db";
import { DiscountType } from "@prisma/client";
import type { Coupon } from "@prisma/client";

export interface CouponValidationResult {
  valid: boolean;
  coupon: Coupon | null;
  discountAmount: number;
  error?: string;
}

/**
 * Validate and calculate discount for a coupon code
 */
export async function validateCoupon(
  code: string,
  userId: string,
  orderAmount: number
): Promise<CouponValidationResult> {
  try {
    // Find coupon by code
    const coupon = await db.coupon.findUnique({
      where: { code: code.toUpperCase().trim() },
    });

    if (!coupon) {
      return {
        valid: false,
        coupon: null,
        discountAmount: 0,
        error: "Coupon code not found",
      };
    }

    // Check if coupon is active
    if (!coupon.isActive) {
      return {
        valid: false,
        coupon,
        discountAmount: 0,
        error: "Coupon is not active",
      };
    }

    // Check start date
    if (coupon.startDate && coupon.startDate > new Date()) {
      return {
        valid: false,
        coupon,
        discountAmount: 0,
        error: "Coupon is not yet valid",
      };
    }

    // Check expiration date
    if (coupon.endDate && coupon.endDate < new Date()) {
      return {
        valid: false,
        coupon,
        discountAmount: 0,
        error: "Coupon has expired",
      };
    }

    // Check minimum purchase amount
    if (coupon.minPurchase && orderAmount < coupon.minPurchase) {
      return {
        valid: false,
        coupon,
        discountAmount: 0,
        error: `Minimum purchase of Rp ${coupon.minPurchase.toLocaleString("id-ID")} required`,
      };
    }

    // Check total usage limit
    if (coupon.usageLimit && coupon.usageCount >= coupon.usageLimit) {
      return {
        valid: false,
        coupon,
        discountAmount: 0,
        error: "Coupon usage limit reached",
      };
    }

    // Check user usage limit
    if (coupon.userLimit) {
      const userUsageCount = await db.couponUsage.count({
        where: {
          couponId: coupon.id,
          userId: userId,
        },
      });

      if (userUsageCount >= coupon.userLimit) {
        return {
          valid: false,
          coupon,
          discountAmount: 0,
          error: "You have already used this coupon",
        };
      }
    }

    // Calculate discount amount
    let discountAmount = 0;

    if (coupon.discountType === DiscountType.PERCENTAGE) {
      discountAmount = Math.round((orderAmount * coupon.discountValue) / 100);
      
      // Apply max discount if set
      if (coupon.maxDiscount && discountAmount > coupon.maxDiscount) {
        discountAmount = coupon.maxDiscount;
      }
    } else if (coupon.discountType === DiscountType.FIXED_AMOUNT) {
      discountAmount = coupon.discountValue;
    }

    // Ensure discount doesn't exceed order amount
    discountAmount = Math.min(discountAmount, orderAmount);

    return {
      valid: true,
      coupon,
      discountAmount,
    };
  } catch (error) {
    console.error("Error validating coupon:", error);
    return {
      valid: false,
      coupon: null,
      discountAmount: 0,
      error: "Error validating coupon",
    };
  }
}

/**
 * Apply coupon to an order and record usage
 */
export async function applyCouponToOrder(
  couponId: string,
  orderId: string,
  userId: string,
  discountAmount: number
): Promise<void> {
  try {
    // Record coupon usage
    await db.couponUsage.create({
      data: {
        couponId,
        orderId,
        userId,
        discountAmount,
      },
    });

    // Increment coupon usage count
    await db.coupon.update({
      where: { id: couponId },
      data: {
        usageCount: {
          increment: 1,
        },
      },
    });
  } catch (error) {
    console.error("Error applying coupon to order:", error);
    throw error;
  }
}

/**
 * Calculate final price after applying discount
 */
export function calculateFinalPrice(
  originalPrice: number,
  discountAmount: number
): number {
  return Math.max(0, originalPrice - discountAmount);
}

