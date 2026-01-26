import { NextResponse, type NextRequest } from "next/server";
import { db } from "@/server/db";
import { DigiflazzStatus, OrderStatus, Prisma } from "@prisma/client";
import { logApiCall, ApiProvider, ApiLogStatus } from "@/lib/api-logger";
import crypto from "crypto";
import { env } from "@/env";

/**
 * Digiflazz Webhook Callback
 * 
 * Digiflazz will send transaction updates via POST to this endpoint
 * Format: { data: { ref_id, customer_no, buyer_sku_code, status, sn, message, rc, ... } }
 * 
 * Documentation: https://developer.digiflazz.com/api/callback
 */

interface DigiflazzCallbackData {
    ref_id: string;
    customer_no: string;
    buyer_sku_code: string;
    message: string;
    status: "Sukses" | "Pending" | "Gagal";
    rc: string;
    sn?: string;
    buyer_last_saldo?: number;
    price?: number;
}

interface DigiflazzCallbackBody {
    data: DigiflazzCallbackData;
    sign?: string;
}

/**
 * Verify Digiflazz webhook signature
 * sign = md5(username + apiKey + ref_id)
 */
function verifyDigiflazzSignature(refId: string, providedSign?: string): boolean {
    if (!providedSign) {
        console.warn("[Digiflazz Webhook] No signature provided");
        return true; // Allow for now, but log warning
    }

    const expectedSign = crypto
        .createHash("md5")
        .update(`${env.DIGIFLAZZ_USERNAME}${env.DIGIFLAZZ_API_KEY}${refId}`)
        .digest("hex");

    return expectedSign === providedSign;
}

export async function POST(request: NextRequest) {
    const startTime = Date.now();

    try {
        const body: DigiflazzCallbackBody = await request.json();

        console.log("=== DIGIFLAZZ WEBHOOK RECEIVED ===", JSON.stringify(body, null, 2));

        const { data, sign } = body;

        if (!data || !data.ref_id) {
            return NextResponse.json(
                { success: false, message: "Invalid webhook data" },
                { status: 400 }
            );
        }

        // Verify signature
        if (!verifyDigiflazzSignature(data.ref_id, sign)) {
            console.error("[Digiflazz Webhook] Invalid signature for ref_id:", data.ref_id);
            return NextResponse.json(
                { success: false, message: "Invalid signature" },
                { status: 401 }
            );
        }

        // Find existing DigiflazzTransaction by ref_id
        const digiflazzTx = await db.digiflazzTransaction.findUnique({
            where: { refId: data.ref_id },
            include: {
                order: true,
            },
        });

        if (!digiflazzTx) {
            console.error("[Digiflazz Webhook] Transaction not found for ref_id:", data.ref_id);
            // Log the API call even if transaction not found
            await logApiCall({
                provider: ApiProvider.DIGIFLAZZ,
                endpoint: "/webhook",
                method: "POST",
                requestData: { ref_id: data.ref_id },
                status: ApiLogStatus.FAILED,
                statusCode: 404,
                errorMessage: "Transaction not found",
                responseTime: Date.now() - startTime,
                refId: data.ref_id,
            });
            return NextResponse.json(
                { success: false, message: "Transaction not found" },
                { status: 404 }
            );
        }

        // Map Digiflazz status to our enum
        let newStatus: DigiflazzStatus;
        switch (data.status) {
            case "Sukses":
                newStatus = DigiflazzStatus.SUKSES;
                break;
            case "Pending":
                newStatus = DigiflazzStatus.PENDING;
                break;
            case "Gagal":
                newStatus = DigiflazzStatus.GAGAL;
                break;
            default:
                newStatus = DigiflazzStatus.PENDING;
        }

        // Update DigiflazzTransaction
        await db.digiflazzTransaction.update({
            where: { id: digiflazzTx.id },
            data: {
                status: newStatus,
                serialNumber: data.sn || digiflazzTx.serialNumber,
                message: data.message,
                webhookData: data as unknown as Prisma.JsonObject,
            },
        });

        console.log("[Digiflazz Webhook] Transaction updated:", {
            refId: data.ref_id,
            oldStatus: digiflazzTx.status,
            newStatus: newStatus,
        });

        // Update order status based on new Digiflazz status
        if (digiflazzTx.order) {
            let orderStatus: OrderStatus;

            switch (newStatus) {
                case DigiflazzStatus.SUKSES:
                    orderStatus = OrderStatus.COMPLETED;
                    await db.order.update({
                        where: { id: digiflazzTx.order.id },
                        data: {
                            status: orderStatus,
                            completedAt: new Date(),
                        },
                    });
                    console.log("[Digiflazz Webhook] Order completed:", digiflazzTx.order.orderNumber);
                    break;

                case DigiflazzStatus.GAGAL:
                    orderStatus = OrderStatus.FAILED;
                    await db.order.update({
                        where: { id: digiflazzTx.order.id },
                        data: {
                            status: orderStatus,
                        },
                    });
                    console.log("[Digiflazz Webhook] Order failed:", digiflazzTx.order.orderNumber);
                    break;

                case DigiflazzStatus.PENDING:
                    // Keep as PROCESSING
                    await db.order.update({
                        where: { id: digiflazzTx.order.id },
                        data: {
                            status: OrderStatus.PROCESSING,
                        },
                    });
                    console.log("[Digiflazz Webhook] Order still processing:", digiflazzTx.order.orderNumber);
                    break;
            }
        }

        // Log successful API callback
        await logApiCall({
            provider: ApiProvider.DIGIFLAZZ,
            endpoint: "/webhook",
            method: "POST",
            requestData: { ref_id: data.ref_id, status: data.status },
            status: ApiLogStatus.SUCCESS,
            statusCode: 200,
            responseTime: Date.now() - startTime,
            refId: data.ref_id,
        });

        return NextResponse.json({
            success: true,
            message: "Webhook processed",
            ref_id: data.ref_id,
            status: newStatus,
        });
    } catch (error) {
        console.error("[Digiflazz Webhook] Error:", error);

        await logApiCall({
            provider: ApiProvider.DIGIFLAZZ,
            endpoint: "/webhook",
            method: "POST",
            requestData: {},
            status: ApiLogStatus.FAILED,
            statusCode: 500,
            errorMessage: error instanceof Error ? error.message : "Unknown error",
            responseTime: Date.now() - startTime,
        });

        return NextResponse.json(
            {
                success: false,
                message: error instanceof Error ? error.message : "Failed to process webhook",
            },
            { status: 500 }
        );
    }
}

/**
 * GET /api/digiflazz/webhook
 * Health check endpoint for Digiflazz webhook
 */
export async function GET() {
    return NextResponse.json({
        success: true,
        message: "Digiflazz webhook endpoint is active",
        timestamp: new Date().toISOString(),
    });
}
