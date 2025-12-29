import { db } from "@/server/db";
import * as fs from "fs";
import * as path from "path";

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

function createSlug(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

/**
 * Import Digiflazz data from JSON file to database
 * This bypasses the API call and uses the data from a JSON file
 */
async function importDigiflazzData(jsonFilePath: string) {
  console.log("Starting Digiflazz data import from JSON file...");
  console.log(`Reading file: ${jsonFilePath}`);

  // Read and parse JSON file
  let fileContent: string;
  try {
    fileContent = fs.readFileSync(jsonFilePath, "utf-8");
  } catch (error) {
    console.error(`❌ Failed to read file: ${jsonFilePath}`);
    console.error(error);
    process.exit(1);
  }

  let jsonData: any;
  try {
    jsonData = JSON.parse(fileContent);
  } catch (error) {
    console.error("❌ Failed to parse JSON file");
    console.error(error);
    process.exit(1);
  }

  // Extract items from various possible JSON structures
  // Digiflazz API can return: { success: true, data: { data: [...] } }
  // Or just: { data: [...] }
  // Or just: [...]
  let items: PriceListItem[] = [];
  if (Array.isArray(jsonData)) {
    items = jsonData;
  } else if (jsonData.data?.data && Array.isArray(jsonData.data.data)) {
    items = jsonData.data.data;
  } else if (jsonData.data && Array.isArray(jsonData.data)) {
    items = jsonData.data;
  } else {
    console.error("❌ Invalid JSON structure. Expected array or { data: [...] }");
    console.error("Found keys:", Object.keys(jsonData));
    process.exit(1);
  }

  if (items.length === 0) {
    console.error("❌ No items found in JSON file");
    process.exit(1);
  }

  console.log(`✅ Found ${items.length} items to import`);

  const now = new Date();
  const categoryMap = new Map<string, string>(); // category slug -> category id
  const productMap = new Map<string, string>(); // product slug -> product id
  let categoriesCreated = 0;
  let productsCreated = 0;
  let itemsCreated = 0;
  let itemsUpdated = 0;
  let itemsSkipped = 0;
  let errors = 0;

  // Process each item
  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    if (!item) continue; // Skip if item is undefined
    
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
              name: item.brand, // Use brand as product name
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
      const status = isActive ? "active" : "inactive";
      const sellPrice = Math.round(item.price * 1.05); // 5% markup

      if (existingItem) {
        // Update existing item
        await db.productItem.update({
          where: { id: existingItem.id },
          data: {
            basePrice: item.price,
            sellPrice: sellPrice,
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
            sellPrice: sellPrice,
            digiflazzStatus: status,
            lastSyncedAt: now,
            isActive: isActive,
            sortOrder: 0,
          },
        });
        itemsCreated++;
      }

      // Progress indicator
      if ((i + 1) % 100 === 0) {
        console.log(`  Processed ${i + 1}/${items.length} items...`);
      }
    } catch (error) {
      console.error(
        `❌ Failed to import item ${item.buyer_sku_code} (${item.product_name}):`,
        error instanceof Error ? error.message : error
      );
      itemsSkipped++;
      errors++;
    }
  }

  // Create sync record
  await db.priceSync.create({
    data: {
      syncType: "full",
      status: errors > 0 ? "failed" : "success",
      itemsSynced: items.length,
      itemsUpdated: itemsUpdated,
      itemsCreated: itemsCreated,
      errorMessage:
        errors > 0
          ? `${errors} items failed to import`
          : null,
      completedAt: now,
    },
  });

  console.log("\n✅ Import completed!");
  console.log(`   Categories created: ${categoriesCreated}`);
  console.log(`   Products created: ${productsCreated}`);
  console.log(`   Product items created: ${itemsCreated}`);
  console.log(`   Product items updated: ${itemsUpdated}`);
  console.log(`   Items skipped: ${itemsSkipped}`);
  console.log(`   Total processed: ${items.length}`);

  return {
    categoriesCreated,
    productsCreated,
    itemsCreated,
    itemsUpdated,
    itemsSkipped,
    totalProcessed: items.length,
  };
}

// Main execution - run when file is executed directly
const runScript = () => {
  const args = process.argv.slice(2);
  const jsonFilePath = args[0];

  if (!jsonFilePath) {
    console.error("❌ Usage: tsx src/scripts/import-digiflazz-data.ts <path-to-json-file>");
    console.error("   Example: tsx src/scripts/import-digiflazz-data.ts ./digiflazz-prices.json");
    console.error("   Or: npm run import:prices ./digiflazz-prices.json");
    process.exit(1);
  }

  // Resolve file path (can be relative or absolute)
  const resolvedPath = path.isAbsolute(jsonFilePath)
    ? jsonFilePath
    : path.resolve(process.cwd(), jsonFilePath);

  if (!fs.existsSync(resolvedPath)) {
    console.error(`❌ File not found: ${resolvedPath}`);
    process.exit(1);
  }

  importDigiflazzData(resolvedPath)
    .then(() => {
      console.log("\n✅ Done!");
      process.exit(0);
    })
    .catch((error) => {
      console.error("\n❌ Import failed:", error);
      process.exit(1);
    })
    .finally(async () => {
      await db.$disconnect();
    });
};

// Run the script if this file is executed directly
runScript();

export { importDigiflazzData };
