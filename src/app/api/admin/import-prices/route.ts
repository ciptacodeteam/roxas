import { NextResponse, type NextRequest } from "next/server";
import { requireAdmin } from "@/lib/auth-helpers";
import { db } from "@/server/db";
import { DigiflazzItemStatus, PriceSyncType, PriceSyncStatus } from "@prisma/client";

interface PriceListItem {
  product_name: string;
  category: string;
  brand: string;
  type: string;
  seller_name: string;
  price: number;
  buyer_sku_code: string;
  buyer_product_status: boolean;
  seller_product_status: boolean;
  unlimited_stock: boolean;
  stock: number;
  multi: boolean;
  start_cut_off: string;
  end_cut_off: string;
  desc: string;
}

function createSlug(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

/**
 * POST /api/admin/import-prices
 * Import Digiflazz JSON data directly to database
 */
export async function POST(request: NextRequest) {
  try {
    await requireAdmin();

    const body = await request.json();
    const items: PriceListItem[] = body.data?.data || body.data || [];

    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid data format. Expected array of products.",
        },
        { status: 400 }
      );
    }

    const now = new Date();
    const categoryMap = new Map<string, string>(); // category slug -> category id
    const productMap = new Map<string, string>(); // product slug -> product id
    let categoriesCreated = 0;
    let productsCreated = 0;
    let itemsCreated = 0;
    let itemsUpdated = 0;
    let itemsSkipped = 0;

    // Process each item
    for (const item of items) {
      try {
        const categorySlug = createSlug(item.category);
        const brandSlug = createSlug(item.brand);
        const productSlug = `${brandSlug}-${categorySlug}`;

        // Get or create category
        let categoryId = categoryMap.get(categorySlug);
        if (!categoryId) {
          let category = await db.category.findUnique({
            where: { slug: categorySlug },
          });

          if (!category) {
            category = await db.category.create({
              data: {
                name: item.category,
                slug: categorySlug,
                isActive: true,
                sortOrder: 0,
              },
            });
            categoriesCreated++;
          }
          categoryId = category.id;
          categoryMap.set(categorySlug, categoryId);
        }

        // Get or create product
        let productId = productMap.get(productSlug);
        if (!productId) {
          // Determine input fields based on category
          let inputFields: string[] = [];
          if (item.category === "Pulsa" || item.category === "PLN") {
            inputFields = ["phoneNumber"];
          } else if (item.category === "Games") {
            if (item.brand === "MOBILE LEGENDS") {
              inputFields = ["userId", "zoneId"];
            } else {
              inputFields = ["userId"];
            }
          } else {
            inputFields = ["userId"];
          }

          let product = await db.product.findUnique({
            where: { slug: productSlug },
          });

          if (!product) {
            product = await db.product.create({
              data: {
                categoryId: categoryId,
                name: item.brand,
                slug: productSlug,
                description: item.desc || undefined,
                inputFields: inputFields,
                isActive: true,
                sortOrder: 0,
              },
            });
            productsCreated++;
          }
          productId = product.id;
          productMap.set(productSlug, productId);
        }

        // Check if product item exists
        const existingItem = await db.productItem.findUnique({
          where: { skuCode: item.buyer_sku_code },
        });

        const isActive =
          item.buyer_product_status && item.seller_product_status;
        const status = isActive ? DigiflazzItemStatus.ACTIVE : DigiflazzItemStatus.INACTIVE;
        const normalPrice = Math.round(item.price * 1.05); // 5% markup

        if (existingItem) {
          // Update existing item
          await db.productItem.update({
            where: { id: existingItem.id },
            data: {
              basePrice: item.price,
              normalPrice: normalPrice,
              // Only update sellPrice if it was previously set to the old normalPrice
              sellPrice: existingItem.sellPrice === existingItem.normalPrice 
                ? normalPrice 
                : existingItem.sellPrice,
              digiflazzStatus: status,
              lastSyncedAt: now,
              isActive: isActive ? existingItem.isActive : false,
            },
          });
          itemsUpdated++;
        } else {
          // Create new item
          await db.productItem.create({
            data: {
              productId: productId,
              name: item.product_name,
              skuCode: item.buyer_sku_code,
              basePrice: item.price,
              normalPrice: normalPrice,
              sellPrice: normalPrice, // Initially set to normalPrice
              digiflazzStatus: status,
              lastSyncedAt: now,
              isActive: isActive,
              sortOrder: 0,
            },
          });
          itemsCreated++;
        }
      } catch (error) {
        console.error(`Failed to import item ${item.buyer_sku_code}:`, error);
        itemsSkipped++;
      }
    }

    // Create sync record
    await db.priceSync.create({
      data: {
        syncType: PriceSyncType.FULL,
        status: PriceSyncStatus.SUCCESS,
        itemsSynced: items.length,
        itemsUpdated: itemsUpdated,
        itemsCreated: itemsCreated,
        completedAt: now,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Import completed successfully",
      result: {
        categoriesCreated,
        productsCreated,
        itemsCreated,
        itemsUpdated,
        itemsSkipped,
        totalProcessed: items.length,
      },
    });
  } catch (error) {
    console.error("Import error:", error);
    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error ? error.message : "Failed to import data",
      },
      { status: 500 }
    );
  }
}

