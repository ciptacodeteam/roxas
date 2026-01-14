import { NextResponse, type NextRequest } from "next/server";
import { requireAdmin } from "@/lib/auth-helpers";
import { db } from "@/server/db";
import { DiscountType, Prisma } from "@prisma/client";

/**
 * GET /api/admin/coupons/[id]
 * Get a single coupon by ID
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();

    const { id } = await params;

    const coupon = await db.coupon.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            usages: true,
          },
        },
        usages: {
          take: 10,
          orderBy: {
            createdAt: "desc",
          },
          include: {
            user: {
              select: {
                id: true,
                email: true,
                name: true,
              },
            },
            order: {
              select: {
                id: true,
                orderNumber: true,
                finalPrice: true,
              },
            },
          },
        },
      },
    });

    if (!coupon) {
      return NextResponse.json(
        {
          success: false,
          message: "Coupon not found",
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: coupon,
    });
  } catch (error) {
    console.error("Get coupon error:", error);
    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error ? error.message : "Failed to get coupon",
      },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/admin/coupons/[id]
 * Update a coupon
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
      code,
      description,
      discountType,
      discountValue,
      minPurchase,
      maxDiscount,
      usageLimit,
      userLimit,
      isActive,
      startDate,
      endDate,
    } = body;

    // Check if coupon exists
    const existingCoupon = await db.coupon.findUnique({
      where: { id },
    });

    if (!existingCoupon) {
      return NextResponse.json(
        {
          success: false,
          message: "Coupon not found",
        },
        { status: 404 }
      );
    }

    // Validate discount type if provided
    if (discountType && !Object.values(DiscountType).includes(discountType)) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid discount type",
        },
        { status: 400 }
      );
    }

    // Validate discount value if provided
    if (discountValue !== undefined) {
      if (discountValue <= 0) {
        return NextResponse.json(
          {
            success: false,
            message: "Discount value must be greater than 0",
          },
          { status: 400 }
        );
      }

      const finalDiscountType = discountType || existingCoupon.discountType;
      if (
        finalDiscountType === DiscountType.PERCENTAGE &&
        discountValue > 100
      ) {
        return NextResponse.json(
          {
            success: false,
            message: "Percentage discount cannot exceed 100%",
          },
          { status: 400 }
        );
      }
    }

    const coupon = await db.coupon.update({
      where: { id },
      data: {
        code: code ? code.toUpperCase().trim() : undefined,
        description,
        discountType,
        discountValue: discountValue ? parseInt(discountValue) : undefined,
        minPurchase: minPurchase !== undefined ? parseInt(minPurchase) : undefined,
        maxDiscount: maxDiscount !== undefined ? parseInt(maxDiscount) : null,
        usageLimit: usageLimit !== undefined ? parseInt(usageLimit) : null,
        userLimit: userLimit !== undefined ? parseInt(userLimit) : undefined,
        isActive,
        startDate: startDate !== undefined ? (startDate ? new Date(startDate) : null) : undefined,
        endDate: endDate !== undefined ? (endDate ? new Date(endDate) : null) : undefined,
      },
    });

    return NextResponse.json({
      success: true,
      data: coupon,
    });
  } catch (error) {
    console.error("Update coupon error:", error);

    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2002") {
        return NextResponse.json(
          {
            success: false,
            message: "Coupon code already exists",
          },
          { status: 400 }
        );
      }
    }

    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error ? error.message : "Failed to update coupon",
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/coupons/[id]
 * Delete a coupon
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();

    const { id } = await params;

    // Check if coupon exists
    const coupon = await db.coupon.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            usages: true,
          },
        },
      },
    });

    if (!coupon) {
      return NextResponse.json(
        {
          success: false,
          message: "Coupon not found",
        },
        { status: 404 }
      );
    }

    // Soft delete by deactivating if there are usages
    if (coupon._count.usages > 0) {
      await db.coupon.update({
        where: { id },
        data: {
          isActive: false,
        },
      });

      return NextResponse.json({
        success: true,
        message: "Coupon deactivated (cannot delete coupon with usage history)",
        data: { id, isActive: false },
      });
    }

    // Hard delete if no usages
    await db.coupon.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: "Coupon deleted successfully",
    });
  } catch (error) {
    console.error("Delete coupon error:", error);
    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error ? error.message : "Failed to delete coupon",
      },
      { status: 500 }
    );
  }
}

