import { NextResponse, type NextRequest } from "next/server";
import { getServerAuthSession } from "@/auth";
import { db } from "@/server/db";
import { createCoreTransaction } from "@/lib/midtrans";
import {
  validateCoupon,
  applyCouponToOrder,
  calculateFinalPrice,
} from "@/lib/coupon";
import { calculateTotalWithFees } from "@/lib/payment-fees";
import { OrderStatus, PaymentStatus, PaymentMethodType } from "@prisma/client";
import crypto from "crypto";

/**
 * POST /api/payments/create
 * Create a payment transaction with Midtrans
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerAuthSession();

    if (!session) {
      return NextResponse.json(
        { success: false, message: "Not authenticated" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { productItemId, customerData, couponCode, paymentMethodId } = body;

    if (!productItemId || !customerData) {
      return NextResponse.json(
        {
          success: false,
          message: "productItemId and customerData are required",
        },
        { status: 400 }
      );
    }

    if (!paymentMethodId) {
      return NextResponse.json(
        {
          success: false,
          message: "paymentMethodId is required",
        },
        { status: 400 }
      );
    }

    // Fetch payment method
    const paymentMethod = await db.paymentMethod.findUnique({
      where: { id: paymentMethodId },
    });

    if (!paymentMethod || !paymentMethod.isActive) {
      return NextResponse.json(
        {
          success: false,
          message: "Payment method not found or inactive",
        },
        { status: 404 }
      );
    }

    // Fetch product item with flash sale info
    const productItem = await db.productItem.findUnique({
      where: { id: productItemId },
      include: {
        product: {
          include: {
            category: true,
          },
        },
        flashSaleItems: {
          include: {
            flashSale: true,
          },
          where: {
            flashSale: {
              isActive: true,
              startTime: { lte: new Date() },
              endTime: { gte: new Date() },
            },
          },
        },
      },
    });

    if (!productItem || !productItem.isActive) {
      return NextResponse.json(
        { success: false, message: "Product item not found or inactive" },
        { status: 404 }
      );
    }

    // Calculate base price (check for active flash sale)
    let originalPrice = productItem.sellPrice;
    const activeFlashSale = productItem.flashSaleItems.find(
      (item) => item.soldCount < item.stock
    );

    if (activeFlashSale) {
      originalPrice = activeFlashSale.salePrice;
    }

    // Validate and apply coupon if provided
    let discountAmount = 0;
    let couponId: string | null = null;
    let couponError: string | null = null;

    if (couponCode) {
      const couponValidation = await validateCoupon(
        couponCode,
        session.user.id,
        originalPrice
      );

      if (couponValidation.valid && couponValidation.coupon) {
        discountAmount = couponValidation.discountAmount;
        couponId = couponValidation.coupon.id;
      } else {
        couponError = couponValidation.error || "Invalid coupon code";
        // Continue with order creation even if coupon is invalid (just don't apply discount)
      }
    }

    // Calculate final price after all discounts
    const finalPrice = calculateFinalPrice(originalPrice, discountAmount);

    if (finalPrice <= 0) {
      return NextResponse.json(
        {
          success: false,
          message: "Final price cannot be zero or negative",
        },
        { status: 400 }
      );
    }

    // Calculate payment fee and VAT
    const { paymentFee, vatAmount, totalAmount } = calculateTotalWithFees(
      finalPrice,
      paymentMethod
    );

    // Generate order number
    const randomId = crypto.randomBytes(4).toString("hex").toUpperCase();
    const orderNumber = `ORD-${Date.now()}-${randomId}`;

    // Create order (use transaction to ensure consistency)
    const order = await db.order.create({
      data: {
        orderNumber,
        userId: session.user.id,
        productItemId,
        customerData,
        originalPrice,
        finalPrice,
        paymentFee,
        vatAmount,
        totalAmount,
        paymentMethodId: paymentMethod.id,
        status: OrderStatus.PENDING,
      },
    });

    // Apply coupon if valid
    if (couponId && discountAmount > 0) {
      try {
        await applyCouponToOrder(couponId, order.id, session.user.id, discountAmount);
      } catch (error) {
        console.error("Error applying coupon:", error);
        // Don't fail the order if coupon application fails
        // Could optionally delete the order here if needed
      }
    }

    // Update flash sale sold count if applicable
    if (activeFlashSale) {
      await db.flashSaleItem.update({
        where: { id: activeFlashSale.id },
        data: {
          soldCount: {
            increment: 1,
          },
        },
      });
    }

    // Get user details
    const user = await db.user.findUnique({
      where: { id: session.user.id },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, message: "User not found" },
        { status: 404 }
      );
    }

    // Map payment method type to Midtrans payment type
    const midtransPaymentTypeMap: Record<PaymentMethodType, string> = {
      [PaymentMethodType.CREDIT_CARD]: "credit_card",
      [PaymentMethodType.BANK_TRANSFER]: "bank_transfer",
      [PaymentMethodType.ECHANNEL]: "echannel",
      [PaymentMethodType.QRIS]: "qris",
      [PaymentMethodType.QRIS_STATIC]: "qris",
      [PaymentMethodType.GOPAY]: "gopay",
      [PaymentMethodType.SHOPEEPAY]: "shopeepay",
    };

    const midtransPaymentType = midtransPaymentTypeMap[paymentMethod.type] as
      | "credit_card"
      | "bank_transfer"
      | "echannel"
      | "qris"
      | "gopay"
      | "shopeepay";

    // Prepare bank transfer config if needed
    const bankTransfer =
      paymentMethod.type === PaymentMethodType.BANK_TRANSFER && paymentMethod.bank
        ? {
            bank: paymentMethod.bank.toLowerCase() as "bca" | "bni" | "permata" | "mandiri",
          }
        : undefined;

    // Create Midtrans Core API transaction
    const coreResponse = await createCoreTransaction({
      orderId: orderNumber,
      grossAmount: totalAmount,
      paymentType: midtransPaymentType,
      customerDetails: {
        firstName: user.name ?? user.email.split("@")[0] ?? "Customer",
        email: user.email,
        phone: user.phone ?? "",
      },
      itemDetails: [
        {
          id: productItem.id,
          price: finalPrice,
          quantity: 1,
          name: `${productItem.product.name} - ${productItem.name}${
            activeFlashSale ? " (Flash Sale)" : ""
          }${discountAmount > 0 ? ` (Coupon: -Rp ${discountAmount.toLocaleString("id-ID")})` : ""}`,
        },
        // Add fee and VAT as separate line items for transparency
        ...(paymentFee > 0
          ? [
              {
                id: "payment-fee",
                price: paymentFee,
                quantity: 1,
                name: `Payment Processing Fee`,
              },
            ]
          : []),
        ...(vatAmount > 0
          ? [
              {
                id: "vat",
                price: vatAmount,
                quantity: 1,
                name: `VAT (${paymentMethod.vatValue}%)`,
              },
            ]
          : []),
      ],
      bankTransfer,
      customField1: order.id,
      customField2: user.id,
    });

    // Extract payment method-specific data from Core API response
    const paymentData: any = {
      orderId: order.id,
      externalId: orderNumber,
      paymentMethodId: paymentMethod.id,
      amount: totalAmount,
      status: PaymentStatus.PENDING,
    };

    // Set payment method-specific fields based on response
    if (coreResponse.va_numbers && coreResponse.va_numbers.length > 0) {
      paymentData.vaNumber = coreResponse.va_numbers[0].va_number;
      paymentData.paymentUrl = coreResponse.actions?.find(
        (a: any) => a.name === "generate-qr-code"
      )?.url;
    } else if (coreResponse.qr_string) {
      paymentData.qrisString = coreResponse.qr_string;
    } else if (coreResponse.actions) {
      const deeplinkAction = coreResponse.actions.find(
        (a: any) => a.name === "deeplink-redirect"
      );
      if (deeplinkAction) {
        paymentData.deeplinkUrl = deeplinkAction.url;
      }
      const redirectAction = coreResponse.actions.find(
        (a: any) => a.name === "get-status" || a.name === "redirect"
      );
      if (redirectAction) {
        paymentData.redirectUrl = redirectAction.url;
        paymentData.paymentUrl = redirectAction.url;
      }
    }

    // Set expiry if provided
    if (coreResponse.expiry_time) {
      paymentData.expiresAt = new Date(coreResponse.expiry_time);
    }

    // Set transaction ID if provided
    if (coreResponse.transaction_id) {
      paymentData.transactionId = coreResponse.transaction_id;
    }

    // Create payment record
    const payment = await db.payment.create({
      data: paymentData,
    });

    return NextResponse.json({
      success: true,
      data: {
        orderId: order.id,
        orderNumber: order.orderNumber,
        paymentId: payment.id,
        paymentUrl: payment.paymentUrl,
        vaNumber: payment.vaNumber,
        qrisString: payment.qrisString,
        deeplinkUrl: payment.deeplinkUrl,
        redirectUrl: payment.redirectUrl,
        amount: totalAmount,
        baseAmount: finalPrice,
        paymentFee,
        vatAmount,
        originalPrice,
        discountAmount,
        couponError: couponError || undefined,
      },
    });
  } catch (error) {
    console.error("Create payment error:", error);
    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error ? error.message : "Failed to create payment",
      },
      { status: 500 }
    );
  }
}

