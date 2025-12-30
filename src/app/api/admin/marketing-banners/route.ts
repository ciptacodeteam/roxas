import { NextResponse, type NextRequest } from "next/server";
import { requireAdmin } from "@/lib/auth-helpers";
import { db } from "@/server/db";

/**
 * GET /api/admin/marketing-banners
 * Fetch all marketing banners
 */
export async function GET(request: NextRequest) {
  try {
    await requireAdmin();

    const banners = await db.marketingBanner.findMany({
      orderBy: {
        sortOrder: "asc",
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

/**
 * POST /api/admin/marketing-banners
 * Create a new marketing banner
 */
export async function POST(request: NextRequest) {
  try {
    await requireAdmin();

    const body = await request.json();
    const { title, image, link, description, isActive, sortOrder, startDate, endDate } = body;

    if (!image) {
      return NextResponse.json(
        {
          success: false,
          message: "Image is required",
        },
        { status: 400 }
      );
    }

    const banner = await db.marketingBanner.create({
      data: {
        title: title || null,
        image,
        link: link || null,
        description: description || null,
        isActive: isActive !== undefined ? isActive : true,
        sortOrder: sortOrder || 0,
        startDate: startDate ? new Date(startDate) : null,
        endDate: endDate ? new Date(endDate) : null,
      },
    });

    return NextResponse.json({
      success: true,
      data: banner,
    });
  } catch (error) {
    console.error("Create marketing banner error:", error);
    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error ? error.message : "Failed to create marketing banner",
      },
      { status: 500 }
    );
  }
}

