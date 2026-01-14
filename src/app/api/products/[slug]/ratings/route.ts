import { NextResponse, type NextRequest } from "next/server";
import { db } from "@/server/db";

/**
 * GET /api/products/[slug]/ratings
 * Fetch ratings for a product by slug (public endpoint)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;

    // Find product by slug
    const product = await db.product.findUnique({
      where: { slug },
      select: { id: true },
    });

    if (!product) {
      return NextResponse.json(
        {
          success: false,
          message: "Product not found",
        },
        { status: 404 }
      );
    }

    // Get active ratings
    const ratings = await db.productRating.findMany({
      where: {
        productId: product.id,
        isActive: true,
      },
      orderBy: [
        { sortOrder: "asc" },
        { createdAt: "desc" },
      ],
      select: {
        id: true,
        rating: true,
        comment: true,
        userName: true,
        createdAt: true,
      },
    });

    // Calculate average rating and total count
    const totalRatings = ratings.length;
    const averageRating =
      totalRatings > 0
        ? ratings.reduce((sum, r) => sum + r.rating, 0) / totalRatings
        : 0;

    return NextResponse.json({
      success: true,
      data: {
        ratings,
        averageRating: Math.round(averageRating * 100) / 100, // Round to 2 decimal places
        totalRatings,
      },
    });
  } catch (error) {
    console.error("Get product ratings error:", error);
    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "Failed to get product ratings",
      },
      { status: 500 }
    );
  }
}

