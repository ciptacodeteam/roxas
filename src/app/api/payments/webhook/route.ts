import { NextResponse, type NextRequest } from "next/server";
import { db } from "@/server/db";
import { verifyWebhookSignature, mapMidtransStatus } from "@/lib/midtrans";
import { PaymentStatus, OrderStatus } from "@prisma/client";

/**
 * POST /api/payments/webhook
 * Handle Midtrans webhook notifications
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Midtrans webhook format
    const {
      transaction_status,
      order_id,
      gross_amount,
      signature_key,
      payment_type,
      fraud_status,
      transaction_time,
      settlement_time,
    } = body;

    // Verify signature
    const isValidSignature = verifyWebhookSignature(
      order_id,
      transaction_status,
      gross_amount.toString(),
      signature_key
    );

    if (!isValidSignature) {
      console.error("Invalid webhook signature", { order_id });
      return NextResponse.json(
        { success: false, message: "Invalid signature" },
        { status: 400 }
      );
    }

    // Find payment by order number (externalId)
    const payment = await db.payment.findUnique({
      where: { externalId: order_id },
      include: {
        order: true,
      },
    });

    if (!payment) {
      console.error("Payment not found", { order_id });
      return NextResponse.json(
        { success: false, message: "Payment not found" },
        { status: 404 }
      );
    }

    // Map Midtrans status
    const { status: paymentStatus, isPaid } = mapMidtransStatus(transaction_status);

    // Update payment
    // Note: paymentMethodId is already set during payment creation, so we don't need to update it here
    const updatedPayment = await db.payment.update({
      where: { id: payment.id },
      data: {
        transactionId: body.transaction_id || payment.transactionId,
        status: paymentStatus,
        paidAt: isPaid && settlement_time ? new Date(settlement_time) : payment.paidAt,
        webhookData: body,
      },
    });

    // Update order status if payment is successful
    if (isPaid && payment.order.status === OrderStatus.PENDING) {
      await db.order.update({
        where: { id: payment.order.id },
        data: {
          status: OrderStatus.PAID,
          paidAt: new Date(settlement_time || transaction_time),
        },
      });

      // TODO: Trigger Digiflazz transaction here
      // This is where you would call your Digiflazz API to process the topup
    }

    // Handle expired/cancelled payments
    if (paymentStatus === PaymentStatus.EXPIRE || paymentStatus === PaymentStatus.CANCEL) {
      await db.order.update({
        where: { id: payment.order.id },
        data: {
          status: OrderStatus.EXPIRED,
        },
      });
    }

    return NextResponse.json({
      success: true,
      message: "Webhook processed",
    });
  } catch (error) {
    console.error("Webhook error:", error);
    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error ? error.message : "Failed to process webhook",
      },
      { status: 500 }
    );
  }
}

