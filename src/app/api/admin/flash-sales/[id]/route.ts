import { NextResponse, type NextRequest } from "next/server";
import { requireAdmin } from "@/lib/auth-helpers";
import { db } from "@/server/db";

/**
 * GET /api/admin/flash-sales/[id]
 * Get a single flash sale
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();

    const { id } = await params;

    const flashSale = await db.flashSale.findUnique({
      where: { id },
      include: {
        items: {
          include: {
            productItem: {
              include: {
                product: {
                  include: {
                    category: {
                      select: {
                        id: true,
                        name: true,
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!flashSale) {
      return NextResponse.json(
        {
          success: false,
          message: "Flash sale not found",
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: flashSale,
    });
  } catch (error) {
    console.error("Get flash sale error:", error);
    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error ? error.message : "Failed to get flash sale",
      },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/admin/flash-sales/[id]
 * Update a flash sale
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();

    const { id } = await params;
    const body = await request.json();
    const { name, startTime, endTime, isActive, items } = body;

    const updateData: {
      name?: string;
      startTime?: Date;
      endTime?: Date;
      isActive?: boolean;
    } = {};

    if (name !== undefined) updateData.name = name;
    if (startTime !== undefined) updateData.startTime = new Date(startTime);
    if (endTime !== undefined) updateData.endTime = new Date(endTime);
    if (isActive !== undefined) updateData.isActive = isActive;

    const flashSale = await db.flashSale.update({
      where: { id },
      data: updateData,
      include: {
        items: {
          include: {
            productItem: {
              include: {
                product: {
                  include: {
                    category: {
                      select: {
                        id: true,
                        name: true,
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    });

    // Update items if provided
    if (items && Array.isArray(items)) {
      // Delete existing items
      await db.flashSaleItem.deleteMany({
        where: { flashSaleId: id },
      });

      // Create new items
      if (items.length > 0) {
        await db.flashSaleItem.createMany({
          data: items.map((item: { productItemId: string; salePrice: number; stock: number }) => ({
            flashSaleId: id,
            productItemId: item.productItemId,
            salePrice: item.salePrice,
            stock: item.stock,
          })),
        });
      }

      // Fetch updated flash sale with items
      const updatedFlashSale = await db.flashSale.findUnique({
        where: { id },
        include: {
          items: {
            include: {
              productItem: {
                include: {
                  product: {
                    include: {
                      category: {
                        select: {
                          id: true,
                          name: true,
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      });

      return NextResponse.json({
        success: true,
        data: updatedFlashSale,
      });
    }

    return NextResponse.json({
      success: true,
      data: flashSale,
    });
  } catch (error) {
    console.error("Update flash sale error:", error);
    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error ? error.message : "Failed to update flash sale",
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/flash-sales/[id]
 * Delete a flash sale
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();

    const { id } = await params;

    await db.flashSale.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: "Flash sale deleted",
    });
  } catch (error) {
    console.error("Delete flash sale error:", error);
    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error ? error.message : "Failed to delete flash sale",
      },
      { status: 500 }
    );
  }
}

