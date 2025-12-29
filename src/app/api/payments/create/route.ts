import { NextResponse, type NextRequest } from "next/server";
import { getServerAuthSession } from "@/auth";
import { db } from "@/server/db";
import { createSnapTransaction } from "@/lib/midtrans";
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
    const { productItemId, customerData, promoCode } = body;

    if (!productItemId || !customerData) {
      return NextResponse.json(
        {
          success: false,
          message: "productItemId and customerData are required",
        },
        { status: 400 }
      );
    }

    // Fetch product item
    const productItem = await db.productItem.findUnique({
      where: { id: productItemId },
      include: {
        product: {
          include: {
            category: true,
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

    // Calculate price (check for flash sale, apply promo, etc.)
    const originalPrice = productItem.sellPrice;
    const finalPrice = originalPrice; // TODO: Apply flash sale and promo discounts

    // Generate order number
    const randomId = crypto.randomBytes(4).toString("hex").toUpperCase();
    const orderNumber = `ORD-${Date.now()}-${randomId}`;

    // Create order
    const order = await db.order.create({
      data: {
        orderNumber,
        userId: session.user.id,
        productItemId,
        customerData,
        originalPrice,
        finalPrice,
        status: "PENDING",
      },
    });

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

    // Create Midtrans transaction
    const snapResponse = await createSnapTransaction({
      orderId: orderNumber,
      grossAmount: finalPrice,
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
          name: `${productItem.product.name} - ${productItem.name}`,
        },
      ],
      customField1: order.id,
      customField2: user.id,
    });

    // Create payment record
    const payment = await db.payment.create({
      data: {
        orderId: order.id,
        externalId: orderNumber,
        paymentUrl: snapResponse.redirectUrl,
        amount: finalPrice,
        status: "pending",
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        orderId: order.id,
        orderNumber: order.orderNumber,
        paymentToken: snapResponse.token,
        paymentUrl: snapResponse.redirectUrl,
        amount: finalPrice,
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

