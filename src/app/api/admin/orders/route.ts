import { NextResponse, type NextRequest } from "next/server";
import { requireAdmin } from "@/lib/auth-helpers";
import { db } from "@/server/db";
import { OrderStatus } from "@prisma/client";

/**
 * GET /api/admin/orders
 * Fetch all orders with related data
 */
export async function GET(request: NextRequest) {
  try {
    await requireAdmin();

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");

    const where: { status?: OrderStatus } = {};
    if (status && Object.values(OrderStatus).includes(status as OrderStatus)) {
      where.status = status as OrderStatus;
    }

    const orders = await db.order.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
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
        payment: {
          select: {
            id: true,
            transactionId: true,
            paymentMethodId: true,
            paymentMethod: {
              select: {
                id: true,
                name: true,
                type: true,
                bank: true,
              },
            },
            status: true,
            amount: true,
            paidAt: true,
          },
        },
        digiflazzTx: {
          select: {
            id: true,
            refId: true,
            trxId: true,
            status: true,
            message: true,
          },
        },
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
    console.error("Get orders error:", error);
    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error ? error.message : "Failed to get orders",
      },
      { status: 500 }
    );
  }
}

