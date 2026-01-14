import { NextResponse, type NextRequest } from "next/server";
import { requireAdmin } from "@/lib/auth-helpers";
import { db } from "@/server/db";
import { PaymentMethodType, BankTransferBank, FeeType } from "@prisma/client";

/**
 * PUT /api/admin/payment-methods/[id]
 * Update a payment method
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
      type,
      bank,
      name,
      description,
      icon,
      feeType,
      feeValue,
      vatType,
      vatValue,
      isActive,
      sortOrder,
      midtransCode,
    } = body;

    // Validate enum values if provided
    if (type && !Object.values(PaymentMethodType).includes(type)) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid payment method type",
        },
        { status: 400 }
      );
    }

    if (bank !== undefined && bank !== null && !Object.values(BankTransferBank).includes(bank)) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid bank",
        },
        { status: 400 }
      );
    }

    if (feeType && !Object.values(FeeType).includes(feeType)) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid fee type",
        },
        { status: 400 }
      );
    }

    if (vatType && !Object.values(FeeType).includes(vatType)) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid VAT type",
        },
        { status: 400 }
      );
    }

    // Get existing payment method to check type
    const existing = await db.paymentMethod.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json(
        {
          success: false,
          message: "Payment method not found",
        },
        { status: 404 }
      );
    }

    const updateType = type || existing.type;
    
    // Bank validation
    if (updateType === PaymentMethodType.BANK_TRANSFER) {
      if (bank === null || bank === undefined) {
        return NextResponse.json(
          {
            success: false,
            message: "Bank is required for BANK_TRANSFER payment method",
          },
          { status: 400 }
        );
      }
    }

    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (icon !== undefined) updateData.icon = icon;
    if (feeType !== undefined) updateData.feeType = feeType;
    if (feeValue !== undefined) updateData.feeValue = feeValue;
    if (vatType !== undefined) updateData.vatType = vatType;
    if (vatValue !== undefined) updateData.vatValue = vatValue;
    if (isActive !== undefined) updateData.isActive = isActive;
    if (sortOrder !== undefined) updateData.sortOrder = sortOrder;
    if (midtransCode !== undefined) updateData.midtransCode = midtransCode;
    if (type !== undefined) updateData.type = type;
    if (bank !== undefined) {
      updateData.bank = updateType === PaymentMethodType.BANK_TRANSFER ? bank : null;
    }

    const paymentMethod = await db.paymentMethod.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({
      success: true,
      data: paymentMethod,
    });
  } catch (error) {
    console.error("Update payment method error:", error);
    
    // Handle unique constraint violation
    if (error instanceof Error && error.message.includes("Unique constraint")) {
      return NextResponse.json(
        {
          success: false,
          message: "A payment method with this type and bank combination already exists",
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error ? error.message : "Failed to update payment method",
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/payment-methods/[id]
 * Delete a payment method
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();

    const { id } = await params;

    // Check if payment method is being used
    const ordersCount = await db.order.count({
      where: { paymentMethodId: id },
    });

    const paymentsCount = await db.payment.count({
      where: { paymentMethodId: id },
    });

    if (ordersCount > 0 || paymentsCount > 0) {
      return NextResponse.json(
        {
          success: false,
          message: "Cannot delete payment method that is being used by orders or payments",
        },
        { status: 400 }
      );
    }

    await db.paymentMethod.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: "Payment method deleted",
    });
  } catch (error) {
    console.error("Delete payment method error:", error);
    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error ? error.message : "Failed to delete payment method",
      },
      { status: 500 }
    );
  }
}

