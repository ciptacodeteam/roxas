import { NextResponse, type NextRequest } from "next/server";
import { requireAdmin } from "@/lib/auth-helpers";
import { db } from "@/server/db";

/**
 * GET /api/admin/marketing-banners/[id]
 * Get marketing banner details
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();

    const { id } = await params;

    const banner = await db.marketingBanner.findUnique({
      where: { id },
    });

    if (!banner) {
      return NextResponse.json(
        {
          success: false,
          message: "Marketing banner not found",
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: banner,
    });
  } catch (error) {
    console.error("Get marketing banner error:", error);
    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error ? error.message : "Failed to get marketing banner",
      },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/admin/marketing-banners/[id]
 * Update a marketing banner
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();

    const { id } = await params;
    const body = await request.json();
    const { title, image, link, description, isActive, sortOrder, startDate, endDate } = body;

    const updateData: {
      title?: string | null;
      image?: string;
      link?: string | null;
      description?: string | null;
      isActive?: boolean;
      sortOrder?: number;
      startDate?: Date | null;
      endDate?: Date | null;
    } = {};

    if (title !== undefined) updateData.title = title || null;
    if (image !== undefined) updateData.image = image;
    if (link !== undefined) updateData.link = link || null;
    if (description !== undefined) updateData.description = description || null;
    if (isActive !== undefined) updateData.isActive = isActive;
    if (sortOrder !== undefined) updateData.sortOrder = sortOrder;
    if (startDate !== undefined) updateData.startDate = startDate ? new Date(startDate) : null;
    if (endDate !== undefined) updateData.endDate = endDate ? new Date(endDate) : null;

    const banner = await db.marketingBanner.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({
      success: true,
      data: banner,
    });
  } catch (error) {
    console.error("Update marketing banner error:", error);
    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error ? error.message : "Failed to update marketing banner",
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/marketing-banners/[id]
 * Delete a marketing banner
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();

    const { id } = await params;

    await db.marketingBanner.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: "Marketing banner deleted",
    });
  } catch (error) {
    console.error("Delete marketing banner error:", error);
    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error ? error.message : "Failed to delete marketing banner",
      },
      { status: 500 }
    );
  }
}

