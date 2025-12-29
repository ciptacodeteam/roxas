import { isPriceSyncNeeded } from "./sync-prices";

/**
 * Ensure prices are synced before serving product data
 * This can be called in API routes that serve product data
 * It will trigger a background sync if data is stale
 */
export async function ensurePricesSynced(maxAgeMinutes: number = 30) {
  try {
    const needsSync = await isPriceSyncNeeded(maxAgeMinutes);

    if (needsSync) {
      // Trigger background sync (don't wait for it)
      fetch("/api/admin/sync-prices?force=false", {
        method: "GET",
      }).catch((error) => {
        console.error("Background sync trigger failed:", error);
        // Don't throw - we'll serve cached data anyway
      });
    }

    return !needsSync; // Return true if data is fresh
  } catch (error) {
    console.error("Error checking price sync:", error);
    return false; // On error, assume we need sync but don't block
  }
}

