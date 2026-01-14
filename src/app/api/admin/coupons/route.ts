import { NextResponse, type NextRequest } from "next/server";
import { requireAdmin } from "@/lib/auth-helpers";
import { db } from "@/server/db";
import { DiscountType, Prisma } from "@prisma/client";

/**
 * GET /api/admin/coupons
 * Fetch all coupons
 */
export async function GET(request: NextRequest) {
  try {
    await requireAdmin();

    const { searchParams } = new URL(request.url);
    const isActive = searchParams.get("isActive");
    const search = searchParams.get("search");

    const where: Prisma.CouponWhereInput = {};

    if (isActive !== null) {
      where.isActive = isActive === "true";
    }

    if (search) {
      where.OR = [
        { code: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
      ];
    }

    const coupons = await db.coupon.findMany({
      where,
      include: {
        _count: {
          select: {
            usages: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json({
      success: true,
      data: coupons,
    });
  } catch (error) {
    console.error("Get coupons error:", error);
    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error ? error.message : "Failed to get coupons",
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/coupons
 * Create a new coupon
 */
export async function POST(request: NextRequest) {
  try {
    await requireAdmin();

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

    if (!code || !discountType || !discountValue) {
      return NextResponse.json(
        {
          success: false,
          message: "code, discountType, and discountValue are required",
        },
        { status: 400 }
      );
    }

    // Validate discount type
    if (!Object.values(DiscountType).includes(discountType)) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid discount type",
        },
        { status: 400 }
      );
    }

    // Validate discount value
    if (discountValue <= 0) {
      return NextResponse.json(
        {
          success: false,
          message: "Discount value must be greater than 0",
        },
        { status: 400 }
      );
    }

    if (discountType === DiscountType.PERCENTAGE && discountValue > 100) {
      return NextResponse.json(
        {
          success: false,
          message: "Percentage discount cannot exceed 100%",
        },
        { status: 400 }
      );
    }

    const coupon = await db.coupon.create({
      data: {
        code: code.toUpperCase().trim(),
        description,
        discountType,
        discountValue: parseInt(discountValue),
        minPurchase: minPurchase ? parseInt(minPurchase) : 0,
        maxDiscount: maxDiscount ? parseInt(maxDiscount) : null,
        usageLimit: usageLimit ? parseInt(usageLimit) : null,
        userLimit: userLimit ? parseInt(userLimit) : 1,
        isActive: isActive !== undefined ? isActive : true,
        startDate: startDate ? new Date(startDate) : null,
        endDate: endDate ? new Date(endDate) : null,
      },
    });

    return NextResponse.json({
      success: true,
      data: coupon,
    });
  } catch (error) {
    console.error("Create coupon error:", error);
    
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
          error instanceof Error ? error.message : "Failed to create coupon",
      },
      { status: 500 }
    );
  }
}

