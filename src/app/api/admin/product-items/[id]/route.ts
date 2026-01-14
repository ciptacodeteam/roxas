import { NextResponse, type NextRequest } from "next/server";
import { requireAdmin } from "@/lib/auth-helpers";
import { db } from "@/server/db";

/**
 * GET /api/admin/product-items/[id]
 * Get a single product item
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();

    const { id } = await params;

    const productItem = await db.productItem.findUnique({
      where: { id },
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
    });

    if (!productItem) {
      return NextResponse.json(
        {
          success: false,
          message: "Product item not found",
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: productItem,
    });
  } catch (error) {
    console.error("Get product item error:", error);
    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error ? error.message : "Failed to get product item",
      },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/admin/product-items/[id]
 * Update product item status
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();

    const { id } = await params;
    const body = await request.json();
    const { 
      isActive, 
      iconImage, 
      group, 
      normalPrice, 
      discountedPrice, 
      sellPrice, 
      basePrice, 
      sortOrder 
    } = body;

    const updateData: any = {};
    
    if (typeof isActive === "boolean") {
      updateData.isActive = isActive;
    }
    
    if (iconImage !== undefined) {
      updateData.iconImage = iconImage || null;
    }
    
    if (group !== undefined) {
      updateData.group = group || null;
    }

    if (typeof normalPrice === "number" && normalPrice >= 0) {
      updateData.normalPrice = normalPrice;
    }

    if (discountedPrice !== undefined) {
      updateData.discountedPrice = discountedPrice === null || discountedPrice === "" ? null : Number(discountedPrice);
    }

    if (typeof sellPrice === "number" && sellPrice >= 0) {
      updateData.sellPrice = sellPrice;
    }

    if (typeof basePrice === "number" && basePrice >= 0) {
      updateData.basePrice = basePrice;
    }

    if (typeof sortOrder === "number") {
      updateData.sortOrder = sortOrder;
    }

    const productItem = await db.productItem.update({
      where: { id },
      data: updateData,
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
    });

    return NextResponse.json({
      success: true,
      data: productItem,
    });
  } catch (error) {
    console.error("Update product item error:", error);
    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error ? error.message : "Failed to update product item",
      },
      { status: 500 }
    );
  }
}

