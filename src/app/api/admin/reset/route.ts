import { NextResponse, type NextRequest } from "next/server";
import { getServerAuthSession } from "@/auth";
import { db } from "@/server/db";
import { UserRole } from "@prisma/client";

/**
 * POST /api/admin/reset
 * Reset test order and transaction data
 * 
 * DANGEROUS: This deletes data, use with caution!
 * Only accessible to authenticated admin users
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

        // Check if user is admin
        const user = await db.user.findUnique({
            where: { id: session.user.id },
        });

        if (!user || user.role !== UserRole.ADMIN) {
            return NextResponse.json(
                { success: false, message: "Not authorized - admin access required" },
                { status: 403 }
            );
        }

        const body = await request.json();
        const { confirm } = body;

        if (confirm !== "RESET_ALL_DATA") {
            return NextResponse.json(
                {
                    success: false,
                    message: "Invalid confirmation code. Pass { confirm: 'RESET_ALL_DATA' } to proceed",
                },
                { status: 400 }
            );
        }

        // Delete in correct order to respect foreign keys
        console.log("=== STARTING DATA RESET ===");

        // 1. Delete DigiflazzTransaction records
        const digiflazzDeleted = await db.digiflazzTransaction.deleteMany({});
        console.log(`[Reset] Deleted ${digiflazzDeleted.count} Digiflazz transactions`);

        // 2. Delete Payment records (cascades will handle Payment deletion via Order)
        const paymentsDeleted = await db.payment.deleteMany({});
        console.log(`[Reset] Deleted ${paymentsDeleted.count} payments`);

        // 3. Delete CouponUsage records (related to orders)
        const couponUsageDeleted = await db.couponUsage.deleteMany({});
        console.log(`[Reset] Deleted ${couponUsageDeleted.count} coupon usages`);

        // 4. Delete ApiLog records
        const apiLogsDeleted = await db.apiLog.deleteMany({});
        console.log(`[Reset] Deleted ${apiLogsDeleted.count} API logs`);

        // 5. Delete Order records (cascades should handle Payment via onDelete: Cascade)
        const ordersDeleted = await db.order.deleteMany({});
        console.log(`[Reset] Deleted ${ordersDeleted.count} orders`);

        console.log("=== DATA RESET COMPLETE ===");

        return NextResponse.json({
            success: true,
            message: "Data reset successfully",
            deleted: {
                digiflazzTransactions: digiflazzDeleted.count,
                payments: paymentsDeleted.count,
                couponUsages: couponUsageDeleted.count,
                apiLogs: apiLogsDeleted.count,
                orders: ordersDeleted.count,
            },
        });
    } catch (error) {
        console.error("[Reset] Error:", error);
        return NextResponse.json(
            {
                success: false,
                message: error instanceof Error ? error.message : "Failed to reset data",
            },
            { status: 500 }
        );
    }
}

/**
 * GET /api/admin/reset
 * Get current counts of records to be deleted
 */
export async function GET(request: NextRequest) {
    try {
        const session = await getServerAuthSession();

        if (!session) {
            return NextResponse.json(
                { success: false, message: "Not authenticated" },
                { status: 401 }
            );
        }

        const user = await db.user.findUnique({
            where: { id: session.user.id },
        });

        if (!user || user.role !== UserRole.ADMIN) {
            return NextResponse.json(
                { success: false, message: "Not authorized" },
                { status: 403 }
            );
        }

        // Get counts
        const [orderCount, paymentCount, digiflazzCount, couponUsageCount, apiLogCount] = await Promise.all([
            db.order.count(),
            db.payment.count(),
            db.digiflazzTransaction.count(),
            db.couponUsage.count(),
            db.apiLog.count(),
        ]);

        return NextResponse.json({
            success: true,
            counts: {
                orders: orderCount,
                payments: paymentCount,
                digiflazzTransactions: digiflazzCount,
                couponUsages: couponUsageCount,
                apiLogs: apiLogCount,
            },
            message: "To reset, send POST request with { confirm: 'RESET_ALL_DATA' }",
        });
    } catch (error) {
        console.error("[Reset] Error getting counts:", error);
        return NextResponse.json(
            {
                success: false,
                message: error instanceof Error ? error.message : "Failed to get counts",
            },
            { status: 500 }
        );
    }
}
