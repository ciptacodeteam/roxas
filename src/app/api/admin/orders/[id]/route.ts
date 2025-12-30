import { NextResponse, type NextRequest } from "next/server";
import { requireAdmin } from "@/lib/auth-helpers";
import { db } from "@/server/db";
import { OrderStatus } from "@prisma/client";

/**
 * PUT /api/admin/orders/[id]
 * Update order status
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
            paymentMethod: true,
            paymentChannel: true,
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
    });

    return NextResponse.json({
      success: true,
      data: order,
    });
  } catch (error) {
    console.error("Update order error:", error);
    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error ? error.message : "Failed to update order",
      },
      { status: 500 }
    );
  }
}

