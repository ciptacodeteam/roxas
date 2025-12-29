# Price Sync Implementation Guide

## Overview
This implementation provides **Option 3: On-Demand Sync with Smart Caching** to handle Digiflazz API rate limits.

## How It Works

1. **Database Storage**: Prices are stored in `ProductItem.basePrice` (from Digiflazz)
2. **Smart Caching**: Sync only runs when data is stale (>30 minutes old)
3. **Background Sync**: Sync runs in background, website serves cached data immediately
4. **Automatic**: Sync triggers automatically when needed
5. **Manual Control**: Admin can manually trigger sync from admin panel

## Database Schema Changes

### ProductItem Table
- `lastSyncedAt`: DateTime? - When this item's price was last synced
- `digiflazzStatus`: String? - "active" | "inactive" from Digiflazz

### PriceSync Table (New)
- Tracks all sync operations
- Records sync status, items synced/updated/created
- Error messages for failed syncs

## API Endpoints

### GET `/api/admin/sync-prices`
- Checks if sync is needed
- Returns last sync status
- Triggers background sync if data is stale

### POST `/api/admin/sync-prices`
- Force immediate sync (synchronous)
- Waits for completion
- Returns detailed results

**Query Parameters:**
- `cmd`: "prepaid" | "pasca" | "full" (default: "full")
- `force`: "true" to force sync even if data is fresh

## Usage

### Manual Sync (Admin Panel)
1. Go to `/admin/price-list`
2. Click "Sync Prices" button
3. Status will show last sync time and results

### Automatic Sync
- Sync triggers automatically when:
  - Data is older than 30 minutes
  - Product pages are accessed (via `ensurePricesSynced()`)

### In Product Pages
```typescript
import { ensurePricesSynced } from "@/lib/ensure-prices-synced";

// In your API route
export async function GET() {
  await ensurePricesSynced(); // Triggers sync if needed
  // ... serve product data from database
}
```

## Sync Process

1. Fetches price list from Digiflazz API (prepaid and/or pasca)
2. Maps products by `buyer_sku_code` (matches `ProductItem.skuCode`)
3. Updates existing products:
   - Updates `basePrice` if changed
   - Updates `digiflazzStatus` (active/inactive)
   - Updates `lastSyncedAt` timestamp
   - Auto-disables if Digiflazz says inactive
4. Skips new products (admin must create products manually first)
5. Records sync results in `PriceSync` table

## Important Notes

1. **First Sync Auto-Creation**: On the **first sync** (when no products exist), the system will automatically:
   - Create Categories from Digiflazz categories
   - Create Products grouped by brand
   - Create ProductItems with prices
   - Set default 5% markup on sellPrice (admin can adjust later)
   - Auto-configure input fields based on category:
     - Pulsa/PLN → `["phoneNumber"]`
     - Mobile Legends → `["userId", "zoneId"]`
     - Other Games → `["userId"]`

2. **Subsequent Syncs**: After first sync, only existing products are updated:
   - Updates `basePrice` if changed
   - Updates `digiflazzStatus` (active/inactive)
   - New Digiflazz products are skipped (admin must create manually)

2. **Price Updates**: Only `basePrice` is updated from Digiflazz. `sellPrice` (your markup) is not touched.

3. **Status Handling**: Product is marked inactive if either `buyer_product_status` OR `seller_product_status` is false.

4. **Error Handling**: If sync fails, website continues to serve cached data. No downtime.

## Next Steps

1. **Restart Dev Server**: After schema changes, restart to regenerate Prisma client
   ```bash
   # Stop server, then:
   npx prisma generate
   # Restart server
   ```

2. **First Sync**: Run your first sync from admin panel:
   - Go to `/admin/price-list`
   - Click "Sync Prices" button
   - System will auto-create all products, categories, and items
   - Wait for completion (may take a few minutes)

3. **Review & Adjust**: After first sync:
   - Review created products in admin panel
   - Adjust `sellPrice` (markup) as needed
   - Update product images, descriptions, etc.
   - Configure input fields if needed

4. **Monitor**: Check sync status regularly in admin panel

## Troubleshooting

- **Prisma Client Errors**: Run `npx prisma generate` after schema changes
- **Sync Not Working**: Check admin authentication and API route permissions
- **Prices Not Updating**: Verify `skuCode` matches Digiflazz `buyer_sku_code`
- **Rate Limit Errors**: Sync frequency is automatically limited (max every 30 min)

