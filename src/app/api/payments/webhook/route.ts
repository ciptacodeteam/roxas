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

    console.log("=== MIDTRANS WEBHOOK RECEIVED ===", JSON.stringify(body, null, 2));

    // Midtrans webhook format
    const {
      transaction_status,
      status_code,
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
      status_code,
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

    console.log("=== PAYMENT FOUND ===", {
      paymentId: payment.id,
      orderId: payment.orderId,
      currentStatus: payment.status,
      currentOrderStatus: payment.order.status,
    });

    // Map Midtrans status
    const { status: paymentStatus, isPaid } = mapMidtransStatus(transaction_status);

    console.log("=== MAPPED STATUS ===", {
      midtransStatus: transaction_status,
      mappedStatus: paymentStatus,
      isPaid,
    });

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

    console.log("=== PAYMENT UPDATED ===", {
      paymentId: updatedPayment.id,
      newStatus: updatedPayment.status,
      paidAt: updatedPayment.paidAt,
    });

    // Update order status if payment is successful
    if (isPaid && payment.order.status === OrderStatus.PENDING) {
      const updatedOrder = await db.order.update({
        where: { id: payment.order.id },
        data: {
          status: OrderStatus.PAID,
          paidAt: new Date(settlement_time || transaction_time),
        },
      });

      console.log("=== ORDER UPDATED ===", {
        orderId: updatedOrder.id,
        newStatus: updatedOrder.status,
        paidAt: updatedOrder.paidAt,
      });

      // TODO: Trigger Digiflazz transaction here
      // This is where you would call your Digiflazz API to process the topup
    } else {
      console.log("=== ORDER NOT UPDATED ===", {
        isPaid,
        currentOrderStatus: payment.order.status,
        reason: !isPaid ? "Payment not settled" : "Order already processed",
      });
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

