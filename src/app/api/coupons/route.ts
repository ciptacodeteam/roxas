import { NextResponse, type NextRequest } from "next/server";
import { db } from "@/server/db";
import { Prisma } from "@prisma/client";

/**
 * GET /api/coupons
 * Fetch active coupons (public endpoint)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const orderAmount = searchParams.get("orderAmount");

    const where: Prisma.CouponWhereInput = {
      isActive: true,
    };

    // Filter by date validity
    const now = new Date();
    where.OR = [
      { startDate: null, endDate: null },
      { startDate: null, endDate: { gte: now } },
      { startDate: { lte: now }, endDate: null },
      { startDate: { lte: now }, endDate: { gte: now } },
    ];

    const coupons = await db.coupon.findMany({
      where,
      orderBy: {
        createdAt: "desc",
      },
    });

    // If orderAmount is provided, filter coupons that can be used
    let applicableCoupons = coupons;
    if (orderAmount) {
      const amount = parseFloat(orderAmount);
      applicableCoupons = coupons.filter((coupon) => {
        // Check if order amount meets minimum purchase requirement
        if (coupon.minPurchase && amount < coupon.minPurchase) {
          return false;
        }
        // Check if usage limit is reached
        if (coupon.usageLimit && coupon.usageCount >= coupon.usageLimit) {
          return false;
        }
        return true;
      });
    }

    return NextResponse.json({
      success: true,
      data: coupons,
      applicable: orderAmount ? applicableCoupons.map((c) => c.id) : undefined,
    });
  } catch (error) {
    console.error("Get coupons error:", error);
    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error ? error.message : "Failed to get coupons",
      },
      { status: 500 }
    );
  }
}

