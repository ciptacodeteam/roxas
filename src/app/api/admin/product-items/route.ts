import { NextResponse, type NextRequest } from "next/server";
import { requireAdmin } from "@/lib/auth-helpers";
import { db } from "@/server/db";
import { DigiflazzItemStatus } from "@prisma/client";

/**
 * GET /api/admin/product-items
 * Fetch all product items (for price list display)
 */
export async function GET(request: NextRequest) {
  try {
    await requireAdmin();

    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category");
    const search = searchParams.get("search");

    // Fetch all product items with their related data
    const productItems = await db.productItem.findMany({
      select: {
        id: true,
        name: true,
        skuCode: true,
        iconImage: true,
        basePrice: true,
        normalPrice: true,
        discountedPrice: true,
        sellPrice: true,
        isActive: true,
        digiflazzStatus: true,
        product: {
          select: {
            id: true,
            name: true,
            description: true,
            category: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    // Transform to PriceListItem format
    const items = productItems.map((item) => {
      const digiflazzStatus = item.digiflazzStatus;
      const isActiveStatus = digiflazzStatus === DigiflazzItemStatus.ACTIVE || item.isActive;
      return {
        product_name: item.name,
        category: item.product.category.name,
        brand: item.product.name,
        type: "Umum", // Default, can be enhanced later
        seller_name: "Internal", // Default
        price: item.basePrice,
        buyer_sku_code: item.skuCode,
        buyer_product_status: isActiveStatus,
        seller_product_status: isActiveStatus,
        unlimited_stock: true,
        stock: 0,
        multi: true,
        start_cut_off: "0:0",
        end_cut_off: "0:0",
        desc: item.product.description || "",
      };
    });

    // Filter by category if provided
    let filteredItems = items;
    if (category) {
      filteredItems = filteredItems.filter(
        (item) => item.category.toLowerCase() === category.toLowerCase()
      );
    }

    // Filter by search if provided
    if (search) {
      const searchLower = search.toLowerCase();
      filteredItems = filteredItems.filter(
        (item) =>
          item.product_name.toLowerCase().includes(searchLower) ||
          item.buyer_sku_code.toLowerCase().includes(searchLower) ||
          item.category.toLowerCase().includes(searchLower) ||
          item.brand.toLowerCase().includes(searchLower)
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        data: filteredItems,
      },
    });
  } catch (error) {
    console.error("Get product items error:", error);
    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error ? error.message : "Failed to get product items",
      },
      { status: 500 }
    );
  }
}

