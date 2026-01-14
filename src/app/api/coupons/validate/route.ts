import { NextResponse, type NextRequest } from "next/server";
import { getServerAuthSession } from "@/auth";
import { validateCoupon } from "@/lib/coupon";

/**
 * POST /api/coupons/validate
 * Validate a coupon code (for public use in checkout)
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerAuthSession();

    if (!session) {
      return NextResponse.json(
        { success: false, message: "Not authenticated" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { code, orderAmount } = body;

    if (!code || !orderAmount) {
      return NextResponse.json(
        {
          success: false,
          message: "code and orderAmount are required",
        },
        { status: 400 }
      );
    }

    if (typeof orderAmount !== "number" || orderAmount <= 0) {
      return NextResponse.json(
        {
          success: false,
          message: "orderAmount must be a positive number",
        },
        { status: 400 }
      );
    }

    const validation = await validateCoupon(code, session.user.id, orderAmount);

    if (!validation.valid) {
      return NextResponse.json({
        success: false,
        valid: false,
        error: validation.error,
        discountAmount: 0,
      });
    }

    return NextResponse.json({
      success: true,
      valid: true,
      discountAmount: validation.discountAmount,
      coupon: {
        code: validation.coupon?.code,
        description: validation.coupon?.description,
        discountType: validation.coupon?.discountType,
        discountValue: validation.coupon?.discountValue,
      },
    });
  } catch (error) {
    console.error("Validate coupon error:", error);
    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error ? error.message : "Failed to validate coupon",
      },
      { status: 500 }
    );
  }
}

