import { NextResponse } from "next/server";
import { db } from "@/server/db";

/**
 * GET /api/marketing-banners
 * Fetch active marketing banners for public display
 * Only returns banners that are:
 * - Active (isActive = true)
 * - Within their scheduled date range (if startDate/endDate are set)
 */
export async function GET() {
  try {
    const now = new Date();

    const banners = await db.marketingBanner.findMany({
      where: {
        isActive: true,
        AND: [
          // If startDate exists, it should be <= now
          {
            OR: [
              { startDate: null },
              { startDate: { lte: now } },
            ],
          },
          // If endDate exists, it should be >= now
          {
            OR: [
              { endDate: null },
              { endDate: { gte: now } },
            ],
          },
        ],
      },
      orderBy: {
        sortOrder: "asc",
      },
      select: {
        id: true,
        title: true,
        image: true,
        link: true,
        description: true,
      },
    });

    return NextResponse.json({
      success: true,
      data: banners,
    });
  } catch (error) {
    console.error("Get marketing banners error:", error);
    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error ? error.message : "Failed to get marketing banners",
      },
      { status: 500 }
    );
  }
}

