import { NextResponse, type NextRequest } from "next/server";
import { requireAdmin } from "@/lib/auth-helpers";
import { db } from "@/server/db";

/**
 * GET /api/admin/categories/[id]/instruction-images
 * Get all instruction images for a category
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();

    const { id } = await params;

    // Verify category exists
    const category = await db.category.findUnique({
      where: { id },
    });

    if (!category) {
      return NextResponse.json(
        {
          success: false,
          message: "Category not found",
        },
        { status: 404 }
      );
    }

    const images = await db.categoryInstructionImage.findMany({
      where: { categoryId: id },
      orderBy: {
        sortOrder: "asc",
      },
    });

    return NextResponse.json({
      success: true,
      data: images,
    });
  } catch (error) {
    console.error("Get instruction images error:", error);
    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "Failed to get instruction images",
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/categories/[id]/instruction-images
 * Add a new instruction image to a category
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();

    const { id } = await params;
    const body = await request.json();
    const { imageUrl, altText, sortOrder } = body;

    if (!imageUrl) {
      return NextResponse.json(
        {
          success: false,
          message: "imageUrl is required",
        },
        { status: 400 }
      );
    }

    // Verify category exists
    const category = await db.category.findUnique({
      where: { id },
    });

    if (!category) {
      return NextResponse.json(
        {
          success: false,
          message: "Category not found",
        },
        { status: 404 }
      );
    }

    // Get max sortOrder to append if not provided
    let finalSortOrder = sortOrder;
    if (finalSortOrder === undefined || finalSortOrder === null) {
      const maxOrder = await db.categoryInstructionImage.findFirst({
        where: { categoryId: id },
        orderBy: { sortOrder: "desc" },
        select: { sortOrder: true },
      });
      finalSortOrder = maxOrder ? maxOrder.sortOrder + 1 : 0;
    }

    const image = await db.categoryInstructionImage.create({
      data: {
        categoryId: id,
        imageUrl,
        altText: altText || null,
        sortOrder: finalSortOrder,
      },
    });

    return NextResponse.json({
      success: true,
      data: image,
    });
  } catch (error) {
    console.error("Create instruction image error:", error);
    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "Failed to create instruction image",
      },
      { status: 500 }
    );
  }
}

