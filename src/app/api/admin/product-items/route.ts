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
    // Note: productId is required, so all items should have a product
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
        createdAt: true,
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

    // Filter by category if provided
    let filteredItems = productItems;
    if (category) {
      filteredItems = filteredItems.filter(
        (item) => item.product.category.name.toLowerCase() === category.toLowerCase()
      );
    }

    // Filter by search if provided
    if (search) {
      const searchLower = search.toLowerCase();
      filteredItems = filteredItems.filter(
        (item) =>
          item.name.toLowerCase().includes(searchLower) ||
          item.skuCode.toLowerCase().includes(searchLower) ||
          item.product.category.name.toLowerCase().includes(searchLower) ||
          item.product.name.toLowerCase().includes(searchLower)
      );
    }

    // Check if format=priceList is requested (for price list page)
    const format = searchParams.get("format");

    if (format === "priceList") {
      // Transform ProductItem data to PriceListItem format expected by price list page
      const priceListItems = filteredItems.map((item) => {
        // Determine buyer_product_status and seller_product_status from digiflazzStatus
        // If digiflazzStatus is ACTIVE, both are true; otherwise both are false
        // Handle null digiflazzStatus (default to inactive)
        const isActive = item.digiflazzStatus === DigiflazzItemStatus.ACTIVE;
        const buyer_product_status = isActive;
        const seller_product_status = isActive;

        return {
          id: item.id, // Include product item ID for editing
          buyer_sku_code: item.skuCode || "",
          product_name: item.name || "",
          product: item.product.name || "", // Product/Brand name
          seller_name: "Digiflazz", // Default seller name, can be updated if stored in DB
          category: item.product.category.name || "N/A",
          type: "", // Type field not stored in ProductItem, can be derived from category if needed
          price: item.sellPrice || item.normalPrice || item.basePrice || 0, // Use sellPrice, fallback to normalPrice or basePrice
          basePrice: item.basePrice || 0, // Base price from Digiflazz
          normalPrice: item.normalPrice || 0,
          sellPrice: item.sellPrice || 0,
          discountedPrice: item.discountedPrice || 0,
          buyer_product_status: buyer_product_status,
          seller_product_status: seller_product_status,
          unlimited_stock: false, // Not stored in ProductItem
          stock: 0, // Not stored in ProductItem
          multi: false, // Not stored in ProductItem
          start_cut_off: "", // Not stored in ProductItem
          end_cut_off: "", // Not stored in ProductItem
          desc: item.product.description || "", // Use product description
          brand: item.product.name || "", // Use product name as brand
        };
      });

      return NextResponse.json({
        success: true,
        data: priceListItems,
      });
    }

    // Default: Return raw ProductItem format (for product items page)
    // Transform dates to ISO strings for JSON serialization
    const formattedProductItems = filteredItems.map((item) => ({
      id: item.id,
      name: item.name,
      skuCode: item.skuCode,
      iconImage: item.iconImage,
      basePrice: item.basePrice,
      normalPrice: item.normalPrice,
      discountedPrice: item.discountedPrice,
      sellPrice: item.sellPrice,
      isActive: item.isActive,
      digiflazzStatus: item.digiflazzStatus,
      createdAt: item.createdAt.toISOString(),
      product: {
        id: item.product.id,
        name: item.product.name,
        category: {
          id: item.product.category.id,
          name: item.product.category.name,
        },
      },
    }));

    return NextResponse.json({
      success: true,
      data: formattedProductItems,
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

