import { NextResponse, type NextRequest } from "next/server";
import { db } from "@/server/db";

/**
 * GET /api/payment-methods
 * Fetch all active payment methods (public endpoint)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const isActive = searchParams.get("isActive");

    const paymentMethods = await db.paymentMethod.findMany({
      where: {
        ...(isActive !== null ? { isActive: isActive === "true" } : { isActive: true }),
      },
      orderBy: [
        { sortOrder: "asc" },
        { createdAt: "desc" },
      ],
    });

    return NextResponse.json({
      success: true,
      data: paymentMethods,
    });
  } catch (error) {
    console.error("Get payment methods error:", error);
    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error ? error.message : "Failed to get payment methods",
      },
      { status: 500 }
    );
  }
}

