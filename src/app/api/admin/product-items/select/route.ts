import { NextResponse, type NextRequest } from "next/server";
import { requireAdmin } from "@/lib/auth-helpers";
import { db } from "@/server/db";

/**
 * GET /api/admin/product-items/select
 * Fetch product items for selection (simplified format)
 */
export async function GET(request: NextRequest) {
  try {
    await requireAdmin();

    const productItems = await db.productItem.findMany({
      where: {
        isActive: true,
      },
      select: {
        id: true,
        name: true,
        skuCode: true,
        sellPrice: true,
        product: {
          select: {
            id: true,
            name: true,
            category: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
      orderBy: {
        product: {
          name: "asc",
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: productItems,
    });
  } catch (error) {
    console.error("Get product items error:", error);
    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error ? error.message : "Failed to get product items",
      },
      { status: 500 }
    );
  }
}

