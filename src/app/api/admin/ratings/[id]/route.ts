import { NextResponse, type NextRequest } from "next/server";
import { requireAdmin } from "@/lib/auth-helpers";
import { db } from "@/server/db";

/**
 * GET /api/admin/ratings/[id]
 * Get a single rating by ID
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();

    const { id } = await params;

    const rating = await db.productRating.findUnique({
      where: { id },
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

    if (!rating) {
      return NextResponse.json(
        {
          success: false,
          message: "Rating not found",
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: rating,
    });
  } catch (error) {
    console.error("Get rating error:", error);
    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error ? error.message : "Failed to get rating",
      },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/admin/ratings/[id]
 * Update a rating
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();

    const { id } = await params;
    const body = await request.json();
    const { productId, rating, comment, userName, isActive, sortOrder } = body;

    // Check if rating exists
    const existingRating = await db.productRating.findUnique({
      where: { id },
    });

    if (!existingRating) {
      return NextResponse.json(
        {
          success: false,
          message: "Rating not found",
        },
        { status: 404 }
      );
    }

    // Validate rating if provided
    if (rating !== undefined && (rating < 1 || rating > 5)) {
      return NextResponse.json(
        {
          success: false,
          message: "Rating must be between 1 and 5",
        },
        { status: 400 }
      );
    }

    // Verify product exists if productId is being changed
    if (productId && productId !== existingRating.productId) {
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
    }

    const updatedRating = await db.productRating.update({
      where: { id },
      data: {
        ...(productId && { productId }),
        ...(rating !== undefined && { rating: parseInt(rating) }),
        ...(comment !== undefined && { comment: comment || null }),
        ...(userName !== undefined && { userName: userName || null }),
        ...(isActive !== undefined && { isActive }),
        ...(sortOrder !== undefined && { sortOrder: parseInt(sortOrder) }),
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
      data: updatedRating,
    });
  } catch (error) {
    console.error("Update rating error:", error);
    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error ? error.message : "Failed to update rating",
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/ratings/[id]
 * Delete a rating
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();

    const { id } = await params;

    const rating = await db.productRating.findUnique({
      where: { id },
    });

    if (!rating) {
      return NextResponse.json(
        {
          success: false,
          message: "Rating not found",
        },
        { status: 404 }
      );
    }

    await db.productRating.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: "Rating deleted successfully",
    });
  } catch (error) {
    console.error("Delete rating error:", error);
    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error ? error.message : "Failed to delete rating",
      },
      { status: 500 }
    );
  }
}

