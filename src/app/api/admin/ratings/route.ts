import { NextResponse, type NextRequest } from "next/server";
import { requireAdmin } from "@/lib/auth-helpers";
import { db } from "@/server/db";
import { Prisma } from "@prisma/client";

/**
 * GET /api/admin/ratings
 * Fetch all ratings
 */
export async function GET(request: NextRequest) {
  try {
    await requireAdmin();

    const { searchParams } = new URL(request.url);
    const productId = searchParams.get("productId");
    const isActive = searchParams.get("isActive");
    const search = searchParams.get("search");

    const where: Prisma.ProductRatingWhereInput = {};

    if (productId) {
      where.productId = productId;
    }

    if (isActive !== null) {
      where.isActive = isActive === "true";
    }

    if (search) {
      where.OR = [
        { userName: { contains: search, mode: "insensitive" } },
        { comment: { contains: search, mode: "insensitive" } },
      ];
    }

    const ratings = await db.productRating.findMany({
      where,
      include: {
        product: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json({
      success: true,
      data: ratings,
    });
  } catch (error) {
    console.error("Get ratings error:", error);
    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error ? error.message : "Failed to get ratings",
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/ratings
 * Create a new rating
 */
export async function POST(request: NextRequest) {
  try {
    await requireAdmin();

    const body = await request.json();
    const { productId, rating, comment, userName, isActive, sortOrder } = body;

    if (!productId || !rating) {
      return NextResponse.json(
        {
          success: false,
          message: "productId and rating are required",
        },
        { status: 400 }
      );
    }

    if (rating < 1 || rating > 5) {
      return NextResponse.json(
        {
          success: false,
          message: "Rating must be between 1 and 5",
        },
        { status: 400 }
      );
    }

    // Verify product exists
    const product = await db.product.findUnique({
      where: { id: productId },
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

    const newRating = await db.productRating.create({
      data: {
        productId,
        rating: parseInt(rating),
        comment: comment || null,
        userName: userName || null,
        isActive: isActive !== undefined ? isActive : true,
        sortOrder: sortOrder ? parseInt(sortOrder) : 0,
      },
      include: {
        product: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: newRating,
    });
  } catch (error) {
    console.error("Create rating error:", error);
    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error ? error.message : "Failed to create rating",
      },
      { status: 500 }
    );
  }
}

