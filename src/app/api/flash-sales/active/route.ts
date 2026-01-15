import { NextResponse } from "next/server";
import { db } from "@/server/db";

/**
 * GET /api/flash-sales/active
 * Get active flash sales with their items
 */
export async function GET() {
  try {
    const now = new Date();

    // Get flash sales that are currently active
    const flashSales = await db.flashSale.findMany({
      where: {
        isActive: true,
        startTime: {
          lte: now,
        },
        endTime: {
          gte: now,
        },
      },
      include: {
        items: {
          include: {
            productItem: {
              include: {
                product: true,
              },
            },
          },
        },
      },
      orderBy: {
        startTime: "asc",
      },
    });

    // If no active flash sale, get the next upcoming one
    if (flashSales.length === 0) {
      const nextFlashSale = await db.flashSale.findFirst({
        where: {
          isActive: true,
          startTime: {
            gt: now,
          },
        },
        include: {
          items: {
            include: {
              productItem: {
                include: {
                  product: true,
                },
              },
            },
          },
        },
        orderBy: {
          startTime: "asc",
        },
      });

      if (nextFlashSale) {
        return NextResponse.json({
          success: true,
          data: [nextFlashSale],
          isUpcoming: true,
        });
      }
    }

    // Format the response
    const formattedSales = flashSales.map((sale) => ({
      id: sale.id,
      name: sale.name,
      startTime: sale.startTime,
      endTime: sale.endTime,
      items: sale.items.map((item) => ({
        id: item.id,
        flashSaleId: item.flashSaleId,
        productItemId: item.productItemId,
        salePrice: item.salePrice,
        stock: item.stock,
        soldCount: item.soldCount,
        productItem: {
          id: item.productItem.id,
          name: item.productItem.name,
          iconImage: item.productItem.iconImage,
          basePrice: item.productItem.basePrice,
          normalPrice: item.productItem.normalPrice,
          sellPrice: item.productItem.sellPrice,
          product: {
            id: item.productItem.product.id,
            name: item.productItem.product.name,
            slug: item.productItem.product.slug,
          },
        },
      })),
    }));

    return NextResponse.json({
      success: true,
      data: formattedSales,
      isUpcoming: false,
    });
  } catch (error) {
    console.error("Get active flash sales error:", error);
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
