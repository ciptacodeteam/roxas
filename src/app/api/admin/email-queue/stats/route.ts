import { NextResponse } from "next/server";
import { getEmailQueueStats } from "@/lib/email-queue";
import { requireAdmin } from "@/lib/auth-helpers";

/**
 * GET /api/admin/email-queue/stats
 * Get email queue statistics (admin only)
 */
export async function GET() {
    try {
        await requireAdmin();

        const stats = await getEmailQueueStats();

        return NextResponse.json({
            success: true,
            stats,
        });
    } catch (error) {
        console.error("Failed to get email queue stats:", error);
        return NextResponse.json(
            {
                success: false,
                message: error instanceof Error ? error.message : "Failed to get queue stats",
            },
            { status: error instanceof Error && error.message.includes("Unauthorized") ? 401 : 500 }
        );
    }
}
