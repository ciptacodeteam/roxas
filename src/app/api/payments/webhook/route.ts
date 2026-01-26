import { NextResponse, type NextRequest } from "next/server";
import { db } from "@/server/db";
import { verifyWebhookSignature, mapMidtransStatus } from "@/lib/midtrans";
import { createDigiflazzTopup } from "@/lib/digiflazz";
import { PaymentStatus, OrderStatus, DigiflazzStatus, Prisma } from "@prisma/client";
import crypto from "crypto";

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
        order: {
          include: {
            productItem: true,
            digiflazzTx: true,
          },
        },
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

      // Trigger Digiflazz transaction for digital product topup
      try {
        // Only proceed if we have product item and no existing transaction
        if (payment.order.productItem && !payment.order.digiflazzTx) {
          // Generate unique ref_id for Digiflazz
          const refId = `DGF-${payment.order.orderNumber}-${crypto.randomBytes(4).toString("hex")}`;

          // Extract customer number from order's customerData
          // customerData format: { "userId": "123456", "serverId": "1234" }
          const customerData = payment.order.customerData as { userId?: string; serverId?: string; customerNo?: string };
          const customerNo = customerData.customerNo ||
            (customerData.userId && customerData.serverId
              ? `${customerData.userId}${customerData.serverId}`
              : customerData.userId || "");

          if (!customerNo) {
            console.error("[Digiflazz] Missing customer number for order:", payment.order.orderNumber);
          } else {
            console.log("[Digiflazz] Initiating topup:", {
              orderNumber: payment.order.orderNumber,
              skuCode: payment.order.productItem.skuCode,
              customerNo,
              refId,
            });

            // Call Digiflazz topup API
            const topupResult = await createDigiflazzTopup({
              skuCode: payment.order.productItem.skuCode,
              customerNo,
              refId,
            });

            console.log("[Digiflazz] Topup result:", topupResult);

            // Map Digiflazz status to our DigiflazzStatus enum
            let digiflazzStatus: DigiflazzStatus;
            switch (topupResult.status) {
              case "Sukses":
                digiflazzStatus = DigiflazzStatus.SUKSES;
                break;
              case "Pending":
                digiflazzStatus = DigiflazzStatus.PENDING;
                break;
              case "Gagal":
                digiflazzStatus = DigiflazzStatus.GAGAL;
                break;
              default:
                digiflazzStatus = DigiflazzStatus.PENDING;
            }

            // Create DigiflazzTransaction record
            await db.digiflazzTransaction.create({
              data: {
                orderId: payment.order.id,
                refId: refId,
                skuCode: payment.order.productItem.skuCode,
                customerNo: customerNo,
                status: digiflazzStatus,
                serialNumber: topupResult.sn,
                message: topupResult.message,
                responseData: topupResult as unknown as Prisma.JsonObject,
              },
            });

            // Update order status based on Digiflazz result
            if (topupResult.status === "Sukses") {
              await db.order.update({
                where: { id: payment.order.id },
                data: {
                  status: OrderStatus.COMPLETED,
                  completedAt: new Date(),
                },
              });
              console.log("[Digiflazz] Order completed successfully:", payment.order.orderNumber);
            } else if (topupResult.status === "Gagal") {
              await db.order.update({
                where: { id: payment.order.id },
                data: {
                  status: OrderStatus.FAILED,
                },
              });
              console.log("[Digiflazz] Order failed:", payment.order.orderNumber, topupResult.message);
            } else {
              // Status is Pending - keep order as PROCESSING
              await db.order.update({
                where: { id: payment.order.id },
                data: {
                  status: OrderStatus.PROCESSING,
                },
              });
              console.log("[Digiflazz] Order pending:", payment.order.orderNumber);
            }
          }
        } else if (payment.order.digiflazzTx) {
          console.log("[Digiflazz] Transaction already exists for order:", payment.order.orderNumber);
        } else {
          console.log("[Digiflazz] No product item found for order:", payment.order.orderNumber);
        }
      } catch (digiflazzError) {
        console.error("[Digiflazz] Topup failed:", digiflazzError);
        // Mark order as failed if Digiflazz call fails
        await db.order.update({
          where: { id: payment.order.id },
          data: {
            status: OrderStatus.FAILED,
          },
        });
      }
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

