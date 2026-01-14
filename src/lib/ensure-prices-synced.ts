import { isPriceSyncNeeded } from "./sync-prices";

// Helper to safely log errors without triggering Turbopack source map issues
const safeLogError = (message: string, error?: unknown) => {
  try {
    const errorMsg = error instanceof Error ? error.message : String(error);
    // Use process.stderr.write to avoid source map issues
    if (typeof process !== "undefined" && process.stderr) {
      process.stderr.write(`${message}${errorMsg ? `: ${errorMsg}` : ""}\n`);
    }
  } catch {
    // Fallback: ignore if logging fails
  }
};

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
      // Use void to explicitly mark as fire-and-forget
      void fetch("/api/admin/sync-prices?force=false", {
        method: "GET",
        cache: "no-store",
      }).catch((error) => {
        safeLogError("Background sync trigger failed", error);
        // Don't throw - we'll serve cached data anyway
      });
    }

    return !needsSync; // Return true if data is fresh
  } catch (error) {
    safeLogError("Error checking price sync", error);
    return false; // On error, assume we need sync but don't block
  }
}

