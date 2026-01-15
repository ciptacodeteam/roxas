import { db } from "@/server/db";
import { getDigiflazzPriceList } from "./digiflazz";
import { DigiflazzItemStatus, PriceSyncType, PriceSyncStatus } from "@prisma/client";
import { getSyncConfig } from "./sync-config";

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

  // Validate required fields
  if (!digiflazzItem.buyer_sku_code) {
    throw new Error(`Missing buyer_sku_code for product: ${digiflazzItem.product_name}`);
  }
  if (!digiflazzItem.product_name) {
    throw new Error(`Missing product_name for SKU: ${digiflazzItem.buyer_sku_code}`);
  }
  if (!digiflazzItem.category) {
    throw new Error(`Missing category for SKU: ${digiflazzItem.buyer_sku_code}`);
  }
  if (!digiflazzItem.brand) {
    throw new Error(`Missing brand for SKU: ${digiflazzItem.buyer_sku_code}`);
  }

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

  // Ensure product has valid ID
  if (!product || !product.id) {
    throw new Error(`Failed to get or create product for SKU: ${digiflazzItem.buyer_sku_code}`);
  }

  // Check if product item already exists (race condition protection)
  const existingProductItem = await db.productItem.findUnique({
    where: { skuCode: digiflazzItem.buyer_sku_code },
  });

  if (existingProductItem) {
    // Update existing item instead of creating duplicate
    const isActive =
      digiflazzItem.buyer_product_status &&
      digiflazzItem.seller_product_status;
    const status = isActive ? DigiflazzItemStatus.ACTIVE : DigiflazzItemStatus.INACTIVE;
    const normalPrice = Math.round(digiflazzItem.price * 1.05);

    return await db.productItem.update({
      where: { id: existingProductItem.id },
      data: {
        productId: product.id, // Ensure product relationship is correct
        name: digiflazzItem.product_name,
        basePrice: digiflazzItem.price,
        normalPrice: normalPrice,
        digiflazzStatus: status,
        lastSyncedAt: now,
        isActive: isActive,
      },
    });
  }

  // Create product item
  const isActive =
    digiflazzItem.buyer_product_status &&
    digiflazzItem.seller_product_status;
  const status = isActive ? DigiflazzItemStatus.ACTIVE : DigiflazzItemStatus.INACTIVE;

  // Calculate normal price (add 5% markup by default, admin can adjust later)
  const normalPrice = Math.round(digiflazzItem.price * 1.05);

  const productItem = await db.productItem.create({
    data: {
      productId: product.id,
      name: digiflazzItem.product_name,
      skuCode: digiflazzItem.buyer_sku_code,
      basePrice: digiflazzItem.price,
      normalPrice: normalPrice,
      sellPrice: normalPrice, // Initially set to normalPrice, can be changed manually
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
 * Auto-creates products if autoCreate is true
 * Can accept JSON data directly instead of fetching from API
 */
export async function syncPricesFromDigiflazz(
  cmd: PriceSyncType = PriceSyncType.FULL,
  autoCreate: boolean = false,
  jsonData?: { prepaid?: PriceListItem[]; pasca?: PriceListItem[] }
): Promise<SyncResult> {
  const result: SyncResult = {
    success: false,
    itemsSynced: 0,
    itemsUpdated: 0,
    itemsCreated: 0,
    itemsSkipped: 0,
  };

  try {
    // Fetch price lists from Digiflazz or use provided JSON data
    const priceLists: PriceListItem[] = [];

    if (jsonData) {
      // Use provided JSON data
      if (cmd === PriceSyncType.PREPAID || cmd === PriceSyncType.FULL) {
        if (jsonData.prepaid && Array.isArray(jsonData.prepaid)) {
          priceLists.push(...jsonData.prepaid);
        }
      }
      if (cmd === PriceSyncType.PASCA || cmd === PriceSyncType.FULL) {
        if (jsonData.pasca && Array.isArray(jsonData.pasca)) {
          priceLists.push(...jsonData.pasca);
        }
      }
    } else {
      // Fetch from Digiflazz API
      if (cmd === PriceSyncType.PREPAID || cmd === PriceSyncType.FULL) {
        const prepaidData = await getDigiflazzPriceList("prepaid");
        if (prepaidData?.data?.data && Array.isArray(prepaidData.data.data)) {
          priceLists.push(...prepaidData.data.data);
        }
      }

      if (cmd === PriceSyncType.PASCA || cmd === PriceSyncType.FULL) {
        const pascaData = await getDigiflazzPriceList("pasca");
        if (pascaData?.data?.data && Array.isArray(pascaData.data.data)) {
          priceLists.push(...pascaData.data.data);
        }
      }
    }

    if (priceLists.length === 0) {
      throw new Error("No price data received");
    }

    result.itemsSynced = priceLists.length;

    // Get all existing product items by skuCode
    const existingItems = await db.productItem.findMany({
      select: {
        id: true,
        skuCode: true,
        basePrice: true,
        normalPrice: true,
        sellPrice: true,
        digiflazzStatus: true,
        isActive: true,
      },
    });

    const existingItemsMap = new Map(
      existingItems.map((item) => [item.skuCode, item])
    );

    const config = getSyncConfig();
    const now = new Date();
    let updated = 0;
    let created = 0;
    let skipped = 0;

    // Prepare batch updates
    const itemsToUpdate: Array<{ id: string; data: any }> = [];
    const itemsToUpdateTimestamp: string[] = [];
    const itemsToCreate: PriceListItem[] = [];

    // Process each item from Digiflazz
    for (const digiflazzItem of priceLists) {
      const skuCode = digiflazzItem.buyer_sku_code;
      const existingItem = existingItemsMap.get(skuCode);

      // Determine status: active only if both buyer and seller status are true
      const isActive =
        digiflazzItem.buyer_product_status &&
        digiflazzItem.seller_product_status;
      const status = isActive ? DigiflazzItemStatus.ACTIVE : DigiflazzItemStatus.INACTIVE;

      if (existingItem) {
        // Update existing item if price or status changed
        const priceChanged = existingItem.basePrice !== digiflazzItem.price;
        const statusChanged =
          existingItem.digiflazzStatus !== status;

        // Calculate new normal price if base price changed
        const newNormalPrice = Math.round(digiflazzItem.price * 1.05);
        const normalPriceChanged = existingItem.normalPrice !== newNormalPrice;
        
        if (priceChanged || statusChanged || normalPriceChanged) {
          itemsToUpdate.push({
            id: existingItem.id,
            data: {
              basePrice: digiflazzItem.price,
              normalPrice: newNormalPrice,
              // Only update sellPrice if it was previously set to the old normalPrice
              // (preserve manually set sellPrice or discountedPrice)
              sellPrice: existingItem.sellPrice === existingItem.normalPrice 
                ? newNormalPrice 
                : existingItem.sellPrice,
              digiflazzStatus: status,
              lastSyncedAt: now,
              // Auto-disable if Digiflazz says it's inactive
              isActive: isActive ? existingItem.isActive : false,
            },
          });
          updated++;
        } else {
          // Just update sync timestamp
          itemsToUpdateTimestamp.push(existingItem.id);
          skipped++;
        }
      } else {
        // New product - always create if autoCreate is enabled
        if (autoCreate) {
          itemsToCreate.push(digiflazzItem);
          created++;
        } else {
          // Skip creating new products (admin must create manually)
          skipped++;
        }
      }
    }

    // Execute batch updates using transactions for better performance
    if (config.logDebugInfo) {
      console.log(`[Sync] Processing batches: ${itemsToUpdate.length} updates, ${itemsToUpdateTimestamp.length} timestamp updates, ${itemsToCreate.length} creates`);
    }

    // Update items with changes in batches
    for (let i = 0; i < itemsToUpdate.length; i += config.batchSize) {
      const batch = itemsToUpdate.slice(i, i + config.batchSize);
      
      await db.$transaction(
        batch.map((item) =>
          db.productItem.update({
            where: { id: item.id },
            data: item.data,
          })
        )
      );
      
      if (config.logDebugInfo && batch.length > 0) {
        console.log(`[Sync] Updated batch ${Math.floor(i / config.batchSize) + 1}/${Math.ceil(itemsToUpdate.length / config.batchSize)}`);
      }
    }

    // Update timestamps only in batches (more efficient)
    for (let i = 0; i < itemsToUpdateTimestamp.length; i += config.batchSize) {
      const batch = itemsToUpdateTimestamp.slice(i, i + config.batchSize);
      
      await db.$transaction(
        batch.map((id) =>
          db.productItem.update({
            where: { id },
            data: { lastSyncedAt: now },
          })
        )
      );
    }

    // Create new items in batches
    for (let i = 0; i < itemsToCreate.length; i += config.batchSize) {
      const batch = itemsToCreate.slice(i, i + config.batchSize);
      
      for (const item of batch) {
        try {
          // Double-check that the item doesn't already exist (race condition protection)
          const existingCheck = await db.productItem.findUnique({
            where: { skuCode: item.buyer_sku_code },
          });
          
          if (existingCheck) {
            console.warn(`ProductItem with SKU ${item.buyer_sku_code} already exists, skipping creation`);
            created--;
            skipped++;
            continue;
          }
          
          await autoCreateProduct(item);
        } catch (error) {
          console.error(
            `Failed to create product for ${item.buyer_sku_code}:`,
            error
          );
          // Log full error details for debugging
          if (error instanceof Error) {
            console.error(`Error details: ${error.message}`);
            console.error(`Stack trace: ${error.stack}`);
          }
          created--;
          skipped++;
        }
      }
      
      if (config.logDebugInfo && batch.length > 0) {
        console.log(`[Sync] Created batch ${Math.floor(i / config.batchSize) + 1}/${Math.ceil(itemsToCreate.length / config.batchSize)}`);
      }
    }

    result.itemsUpdated = updated;
    result.itemsCreated = created;
    result.itemsSkipped = skipped;
    result.success = true;

    if (config.logDebugInfo) {
      console.log(`[Sync] Completed: ${updated} updated, ${created} created, ${skipped} skipped`);
    }

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
  maxAgeMinutes?: number
): Promise<boolean> {
  try {
    const config = getSyncConfig();
    const threshold = maxAgeMinutes || config.stalePriceThresholdMinutes;

    // Check the most recent sync record
    const lastSync = await db.priceSync.findFirst({
      where: {
        status: PriceSyncStatus.SUCCESS,
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

    return ageMinutes > threshold;
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

