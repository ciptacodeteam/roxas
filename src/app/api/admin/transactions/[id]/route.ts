import { NextResponse, type NextRequest } from "next/server";
import { requireAdmin } from "@/lib/auth-helpers";
import { db } from "@/server/db";
import { OrderStatus } from "@prisma/client";

/**
 * GET /api/admin/transactions/[id]
 * Get a single transaction (order)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();

    const { id } = await params;

    const order = await db.order.findUnique({
      where: { id },
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
    });

    if (!order) {
      return NextResponse.json(
        {
          success: false,
          message: "Transaction not found",
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: order,
    });
  } catch (error) {
    console.error("Get transaction error:", error);
    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error ? error.message : "Failed to get transaction",
      },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/admin/transactions/[id]
 * Update transaction (order) status
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();

    const { id } = await params;
    const body = await request.json();
    const { status } = body;

    if (!status || !Object.values(OrderStatus).includes(status)) {
      return NextResponse.json(
        {
          success: false,
          message: "Valid status is required",
        },
        { status: 400 }
      );
    }

    const updateData: {
      status: OrderStatus;
      paidAt?: Date;
      completedAt?: Date;
    } = {
      status: status as OrderStatus,
    };

    // Set timestamps based on status
    if (status === OrderStatus.PAID && !body.paidAt) {
      updateData.paidAt = new Date();
    }
    if (status === OrderStatus.COMPLETED && !body.completedAt) {
      updateData.completedAt = new Date();
    }

    const order = await db.order.update({
      where: { id },
      data: updateData,
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
    });

    return NextResponse.json({
      success: true,
      data: order,
    });
  } catch (error) {
    console.error("Update transaction error:", error);
    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error ? error.message : "Failed to update transaction",
      },
      { status: 500 }
    );
  }
}

