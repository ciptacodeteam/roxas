import { NextResponse, type NextRequest } from "next/server";
import { requireAdmin } from "@/lib/auth-helpers";
import { db } from "@/server/db";
import { PaymentMethodType, BankTransferBank, FeeType } from "@prisma/client";

/**
 * GET /api/admin/payment-methods
 * Fetch all payment methods
 */
export async function GET(request: NextRequest) {
  try {
    await requireAdmin();

    const { searchParams } = new URL(request.url);
    const isActive = searchParams.get("isActive");

    const paymentMethods = await db.paymentMethod.findMany({
      where: {
        ...(isActive !== null && { isActive: isActive === "true" }),
      },
      orderBy: [
        { sortOrder: "asc" },
        { createdAt: "desc" },
      ],
    });

    return NextResponse.json({
      success: true,
      data: paymentMethods,
    });
  } catch (error) {
    console.error("Get payment methods error:", error);
    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error ? error.message : "Failed to get payment methods",
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/payment-methods
 * Create a new payment method
 */
export async function POST(request: NextRequest) {
  try {
    await requireAdmin();

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

    if (!type || !name || !midtransCode) {
      return NextResponse.json(
        {
          success: false,
          message: "Type, name, and midtransCode are required",
        },
        { status: 400 }
      );
    }

    // Validate enum values
    if (!Object.values(PaymentMethodType).includes(type)) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid payment method type",
        },
        { status: 400 }
      );
    }

    if (bank && !Object.values(BankTransferBank).includes(bank)) {
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

    // Bank is required for BANK_TRANSFER type
    if (type === PaymentMethodType.BANK_TRANSFER && !bank) {
      return NextResponse.json(
        {
          success: false,
          message: "Bank is required for BANK_TRANSFER payment method",
        },
        { status: 400 }
      );
    }

    // Bank should be null for non-bank transfer methods
    const bankValue = type === PaymentMethodType.BANK_TRANSFER ? bank : null;

    const paymentMethod = await db.paymentMethod.create({
      data: {
        type: type as PaymentMethodType,
        bank: bankValue as BankTransferBank | null,
        name,
        description,
        icon,
        feeType: (feeType || FeeType.PERCENTAGE) as FeeType,
        feeValue: feeValue || 0,
        vatType: (vatType || FeeType.PERCENTAGE) as FeeType,
        vatValue: vatValue || 0,
        isActive: isActive !== undefined ? isActive : true,
        sortOrder: sortOrder || 0,
        midtransCode,
      },
    });

    return NextResponse.json({
      success: true,
      data: paymentMethod,
    });
  } catch (error) {
    console.error("Create payment method error:", error);
    
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
          error instanceof Error ? error.message : "Failed to create payment method",
      },
      { status: 500 }
    );
  }
}

