import { NextResponse, type NextRequest } from "next/server";
import { requireAdmin } from "@/lib/auth-helpers";
import { db } from "@/server/db";

/**
 * GET /api/admin/flash-sales
 * Fetch all flash sales with their items
 */
export async function GET(request: NextRequest) {
  try {
    await requireAdmin();

    const flashSales = await db.flashSale.findMany({
      include: {
        items: {
          include: {
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
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json({
      success: true,
      data: flashSales,
    });
  } catch (error) {
    console.error("Get flash sales error:", error);
    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error ? error.message : "Failed to get flash sales",
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/flash-sales
 * Create a new flash sale
 */
export async function POST(request: NextRequest) {
  try {
    await requireAdmin();

    const body = await request.json();
    const { name, startTime, endTime, isActive, items } = body;

    if (!name || !startTime || !endTime) {
      return NextResponse.json(
        {
          success: false,
          message: "Name, startTime, and endTime are required",
        },
        { status: 400 }
      );
    }

    const flashSale = await db.flashSale.create({
      data: {
        name,
        startTime: new Date(startTime),
        endTime: new Date(endTime),
        isActive: isActive !== undefined ? isActive : true,
        items: items && Array.isArray(items) ? {
          create: items.map((item: { productItemId: string; salePrice: number; stock: number }) => ({
            productItemId: item.productItemId,
            salePrice: item.salePrice,
            stock: item.stock,
          })),
        } : undefined,
      },
      include: {
        items: {
          include: {
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
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: flashSale,
    });
  } catch (error) {
    console.error("Create flash sale error:", error);
    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error ? error.message : "Failed to create flash sale",
      },
      { status: 500 }
    );
  }
}

