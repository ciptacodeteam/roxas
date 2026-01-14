import { NextResponse, type NextRequest } from "next/server";
import { requireAdmin } from "@/lib/auth-helpers";
import { db } from "@/server/db";

/**
 * PUT /api/admin/categories/[id]/instruction-images/[imageId]
 * Update an instruction image
 */
export async function PUT(
  request: NextRequest,
  {
    params,
  }: {
    params: Promise<{ id: string; imageId: string }>;
  }
) {
  try {
    await requireAdmin();

    const { id, imageId } = await params;
    const body = await request.json();
    const { imageUrl, altText, sortOrder } = body;

    // Verify image exists and belongs to category
    const image = await db.categoryInstructionImage.findUnique({
      where: { id: imageId },
    });

    if (!image || image.categoryId !== id) {
      return NextResponse.json(
        {
          success: false,
          message: "Instruction image not found",
        },
        { status: 404 }
      );
    }

    const updatedImage = await db.categoryInstructionImage.update({
      where: { id: imageId },
      data: {
        ...(imageUrl && { imageUrl }),
        ...(altText !== undefined && { altText }),
        ...(sortOrder !== undefined && { sortOrder: parseInt(sortOrder) }),
      },
    });

    return NextResponse.json({
      success: true,
      data: updatedImage,
    });
  } catch (error) {
    console.error("Update instruction image error:", error);
    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "Failed to update instruction image",
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/categories/[id]/instruction-images/[imageId]
 * Delete an instruction image
 */
export async function DELETE(
  request: NextRequest,
  {
    params,
  }: {
    params: Promise<{ id: string; imageId: string }>;
  }
) {
  try {
    await requireAdmin();

    const { id, imageId } = await params;

    // Verify image exists and belongs to category
    const image = await db.categoryInstructionImage.findUnique({
      where: { id: imageId },
    });

    if (!image || image.categoryId !== id) {
      return NextResponse.json(
        {
          success: false,
          message: "Instruction image not found",
        },
        { status: 404 }
      );
    }

    await db.categoryInstructionImage.delete({
      where: { id: imageId },
    });

    return NextResponse.json({
      success: true,
      message: "Instruction image deleted successfully",
    });
  } catch (error) {
    console.error("Delete instruction image error:", error);
    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "Failed to delete instruction image",
      },
      { status: 500 }
    );
  }
}

