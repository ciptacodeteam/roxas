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
 * Documentation: https://developer.digiflazz.com/api/buyer/webhook/
 * 
 * Headers:
 * - X-Digiflazz-Event: "create" | "update"
 * - X-Hub-Signature: sha1=<HMAC-SHA1 of body using webhook secret>
 * - User-Agent: "Digiflazz-Hookshot" (prepaid) | "Digiflazz-Pasca-Hookshot" (postpaid)
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
    data?: DigiflazzCallbackData;
    // Ping event fields
    sed?: string;
    hook_id?: string;
    hook?: {
        url: string;
        secret: string;
        type: string;
        status: number;
    };
}

/**
 * Verify Digiflazz webhook signature using HMAC-SHA1
 * X-Hub-Signature: sha1=<HMAC-SHA1 of raw body using webhook secret>
 * 
 * Example from docs:
 * $signature = hash_hmac('sha1', $post_data, $secret);
 * if ($request->header('X-Hub-Signature') == 'sha1='.$signature) { ... }
 */
function verifyDigiflazzSignature(rawBody: string, signatureHeader?: string | null): boolean {
    const webhookSecret = env.DIGIFLAZZ_WEBHOOK_SECRET;
    
    // If no secret configured, skip verification with warning
    if (!webhookSecret) {
        console.warn("[Digiflazz Webhook] No DIGIFLAZZ_WEBHOOK_SECRET configured, skipping signature verification");
        return true;
    }

    // If no signature provided by Digiflazz
    if (!signatureHeader) {
        console.warn("[Digiflazz Webhook] No X-Hub-Signature header provided");
        return true; // Allow for now, but log warning
    }

    // Calculate expected signature: HMAC-SHA1(rawBody, secret)
    const expectedSignature = "sha1=" + crypto
        .createHmac("sha1", webhookSecret)
        .update(rawBody)
        .digest("hex");

    const isValid = expectedSignature === signatureHeader;
    
    if (!isValid) {
        console.error("[Digiflazz Webhook] Signature mismatch:", {
            expected: expectedSignature,
            received: signatureHeader,
        });
    }

    return isValid;
}

export async function POST(request: NextRequest) {
    const startTime = Date.now();

    try {
        // Get raw body for signature verification
        const rawBody = await request.text();
        const body: DigiflazzCallbackBody = JSON.parse(rawBody);

        // Get headers for logging
        const eventType = request.headers.get("X-Digiflazz-Event");
        const signatureHeader = request.headers.get("X-Hub-Signature");
        const userAgent = request.headers.get("User-Agent");

        console.log("=== DIGIFLAZZ WEBHOOK RECEIVED ===");
        console.log("Event:", eventType);
        console.log("User-Agent:", userAgent);
        console.log("Signature:", signatureHeader);
        console.log("Body:", JSON.stringify(body, null, 2));

        // Handle ping event (webhook verification)
        if (body.hook_id && body.sed) {
            console.log("[Digiflazz Webhook] Ping event received, webhook is active");
            return NextResponse.json({
                success: true,
                message: "Webhook ping received",
                hook_id: body.hook_id,
            });
        }

        const { data } = body;

        if (!data || !data.ref_id) {
            return NextResponse.json(
                { success: false, message: "Invalid webhook data - missing data or ref_id" },
                { status: 400 }
            );
        }

        // Verify HMAC-SHA1 signature
        if (!verifyDigiflazzSignature(rawBody, signatureHeader)) {
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
