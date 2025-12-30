import { NextResponse, type NextRequest } from "next/server";
import { requireAdmin } from "@/lib/auth-helpers";
import { db } from "@/server/db";

/**
 * GET /api/admin/transactions
 * Fetch all transactions (orders with payment and digiflazz data)
 */
export async function GET(request: NextRequest) {
  try {
    await requireAdmin();

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const paymentStatus = searchParams.get("paymentStatus");

    const where: {
      status?: string;
      payment?: {
        status?: string;
      };
    } = {};

    if (status) {
      where.status = status;
    }

    if (paymentStatus) {
      where.payment = {
        status: paymentStatus,
      };
    }

    const orders = await db.order.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
            phone: true,
          },
        },
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
        payment: true,
        digiflazzTx: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json({
      success: true,
      data: orders,
    });
  } catch (error) {
    console.error("Get transactions error:", error);
    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error ? error.message : "Failed to get transactions",
      },
      { status: 500 }
    );
  }
}

