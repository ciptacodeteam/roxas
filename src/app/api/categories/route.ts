import { NextResponse } from "next/server";
import { db } from "@/server/db";

/**
 * GET /api/categories
 * Fetch all active categories from database
 */
export async function GET() {
  try {
    const categories = await db.category.findMany({
      where: {
        isActive: true,
      },
      orderBy: {
        sortOrder: "asc",
      },
      select: {
        id: true,
        name: true,
        slug: true,
        icon: true,
      },
    });

    return NextResponse.json({
      success: true,
      data: categories,
    });
  } catch (error) {
    console.error("Get categories error:", error);
    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error ? error.message : "Failed to get categories",
      },
      { status: 500 }
    );
  }
}

