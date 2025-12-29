import { db } from "@/server/db";
import { getDigiflazzPriceList } from "./digiflazz";

// Price list item interface matching Digiflazz API response
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

interface SyncResult {
  success: boolean;
  itemsSynced: number;
  itemsUpdated: number;
  itemsCreated: number;
  itemsSkipped: number;
  error?: string;
}

/**
 * Helper function to create slug from string
 */
function createSlug(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

/**
 * Auto-create product structure from Digiflazz item
 * Creates Category -> Product -> ProductItem if they don't exist
 */
async function autoCreateProduct(digiflazzItem: PriceListItem) {
  const now = new Date();
  const categorySlug = createSlug(digiflazzItem.category);
  const brandSlug = createSlug(digiflazzItem.brand);
  const productSlug = `${brandSlug}-${categorySlug}`;

  // Determine input fields based on category
  let inputFields: string[] = [];
  if (digiflazzItem.category === "Pulsa" || digiflazzItem.category === "PLN") {
    inputFields = ["phoneNumber"];
  } else if (digiflazzItem.category === "Games") {
    // Check if it's Mobile Legends (needs userId + zoneId)
    if (digiflazzItem.brand === "MOBILE LEGENDS") {
      inputFields = ["userId", "zoneId"];
    } else {
      inputFields = ["userId"];
    }
  } else {
    inputFields = ["userId"]; // Default for vouchers
  }

  // Get or create category
  let category = await db.category.findUnique({
    where: { slug: categorySlug },
  });

  if (!category) {
    category = await db.category.create({
      data: {
        name: digiflazzItem.category,
        slug: categorySlug,
        isActive: true,
        sortOrder: 0,
      },
    });
  }

  // Get or create product
  let product = await db.product.findUnique({
    where: { slug: productSlug },
  });

  if (!product) {
    product = await db.product.create({
      data: {
        categoryId: category.id,
        name: digiflazzItem.brand,
        slug: productSlug,
        description: digiflazzItem.desc || undefined,
        inputFields: inputFields,
        isActive: true,
        sortOrder: 0,
      },
    });
  }

  // Create product item
  const isActive =
    digiflazzItem.buyer_product_status &&
    digiflazzItem.seller_product_status;
  const status = isActive ? "active" : "inactive";

  // Calculate sell price (add 5% markup by default, admin can adjust later)
  const sellPrice = Math.round(digiflazzItem.price * 1.05);

  const productItem = await db.productItem.create({
    data: {
      productId: product.id,
      name: digiflazzItem.product_name,
      skuCode: digiflazzItem.buyer_sku_code,
      basePrice: digiflazzItem.price,
      sellPrice: sellPrice,
      digiflazzStatus: status,
      lastSyncedAt: now,
      isActive: isActive,
      sortOrder: 0,
    },
  });

  return productItem;
}

/**
 * Sync prices from Digiflazz API to database
 * Maps Digiflazz products to ProductItem by skuCode
 * Auto-creates products on first sync if autoCreate is true
 */
export async function syncPricesFromDigiflazz(
  cmd: "prepaid" | "pasca" | "full" = "full",
  autoCreate: boolean = false
): Promise<SyncResult> {
  const result: SyncResult = {
    success: false,
    itemsSynced: 0,
    itemsUpdated: 0,
    itemsCreated: 0,
    itemsSkipped: 0,
  };

  try {
    // Fetch price lists from Digiflazz
    const priceLists: PriceListItem[] = [];

    if (cmd === "prepaid" || cmd === "full") {
      const prepaidData = await getDigiflazzPriceList("prepaid");
      if (prepaidData?.data?.data && Array.isArray(prepaidData.data.data)) {
        priceLists.push(...prepaidData.data.data);
      }
    }

    if (cmd === "pasca" || cmd === "full") {
      const pascaData = await getDigiflazzPriceList("pasca");
      if (pascaData?.data?.data && Array.isArray(pascaData.data.data)) {
        priceLists.push(...pascaData.data.data);
      }
    }

    if (priceLists.length === 0) {
      throw new Error("No price data received from Digiflazz API");
    }

    result.itemsSynced = priceLists.length;

    // Get all existing product items by skuCode
    const existingItems = await db.productItem.findMany({
      select: {
        id: true,
        skuCode: true,
        basePrice: true,
        digiflazzStatus: true,
        isActive: true,
      },
    });

    const existingItemsMap = new Map(
      existingItems.map((item) => [item.skuCode, item])
    );

    const now = new Date();
    let updated = 0;
    let created = 0;
    let skipped = 0;

    // Process each item from Digiflazz
    for (const digiflazzItem of priceLists) {
      const skuCode = digiflazzItem.buyer_sku_code;
      const existingItem = existingItemsMap.get(skuCode);

      // Determine status: active only if both buyer and seller status are true
      const isActive =
        digiflazzItem.buyer_product_status &&
        digiflazzItem.seller_product_status;
      const status = isActive ? "active" : "inactive";

      if (existingItem) {
        // Update existing item if price or status changed
        const priceChanged = existingItem.basePrice !== digiflazzItem.price;
        const statusChanged =
          existingItem.digiflazzStatus !== status;

        if (priceChanged || statusChanged) {
          await db.productItem.update({
            where: { id: existingItem.id },
            data: {
              basePrice: digiflazzItem.price,
              digiflazzStatus: status,
              lastSyncedAt: now,
              // Auto-disable if Digiflazz says it's inactive
              isActive: isActive ? existingItem.isActive : false,
            },
          });
          updated++;
        } else {
          // Just update sync timestamp
          await db.productItem.update({
            where: { id: existingItem.id },
            data: {
              lastSyncedAt: now,
            },
          });
          skipped++;
        }
      } else {
        // New product
        if (autoCreate) {
          // Auto-create product structure (Category -> Product -> ProductItem)
          try {
            await autoCreateProduct(digiflazzItem);
            created++;
          } catch (error) {
            console.error(
              `Failed to create product for ${skuCode}:`,
              error
            );
            skipped++;
          }
        } else {
          // Skip creating new products (admin must create manually)
          skipped++;
        }
      }
    }

    result.itemsUpdated = updated;
    result.itemsCreated = created;
    result.itemsSkipped = skipped;
    result.success = true;

    return result;
  } catch (error) {
    console.error("Error syncing prices:", error);
    result.error =
      error instanceof Error ? error.message : "Unknown error occurred";
    return result;
  }
}

/**
 * Check if this is the first sync (no products exist)
 */
export async function isFirstSync(): Promise<boolean> {
  try {
    const productCount = await db.productItem.count();
    return productCount === 0;
  } catch (error) {
    console.error("Error checking first sync:", error);
    return false;
  }
}

/**
 * Check if price sync is needed (data is stale)
 */
export async function isPriceSyncNeeded(
  maxAgeMinutes: number = 30
): Promise<boolean> {
  try {
    // Check the most recent sync record
    const lastSync = await db.priceSync.findFirst({
      where: {
        status: "success",
      },
      orderBy: {
        completedAt: "desc",
      },
    });

    if (!lastSync || !lastSync.completedAt) {
      return true; // Never synced, need sync
    }

    const now = new Date();
    const ageMinutes =
      (now.getTime() - lastSync.completedAt.getTime()) / (1000 * 60);

    return ageMinutes > maxAgeMinutes;
  } catch (error) {
    console.error("Error checking sync status:", error);
    return true; // On error, assume sync is needed
  }
}

/**
 * Get last sync status
 */
export async function getLastSyncStatus() {
  try {
    const lastSync = await db.priceSync.findFirst({
      orderBy: {
        startedAt: "desc",
      },
    });

    if (!lastSync) {
      return null;
    }

    return {
      id: lastSync.id,
      syncType: lastSync.syncType,
      status: lastSync.status,
      itemsSynced: lastSync.itemsSynced,
      itemsUpdated: lastSync.itemsUpdated,
      itemsCreated: lastSync.itemsCreated,
      errorMessage: lastSync.errorMessage,
      startedAt: lastSync.startedAt,
      completedAt: lastSync.completedAt,
      ageMinutes: lastSync.completedAt
        ? Math.floor(
            (new Date().getTime() - lastSync.completedAt.getTime()) /
              (1000 * 60)
          )
        : null,
    };
  } catch (error) {
    console.error("Error getting sync status:", error);
    return null;
  }
}

