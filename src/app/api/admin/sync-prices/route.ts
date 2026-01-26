import { NextResponse, type NextRequest } from "next/server";
import { requireAdmin } from "@/lib/auth-helpers";
import {
  syncPricesFromDigiflazz,
  isPriceSyncNeeded,
  getLastSyncStatus,
  isFirstSync,
} from "@/lib/sync-prices";
import { db } from "@/server/db";
import { PriceSyncType, PriceSyncStatus } from "@prisma/client";
import { apiCache } from "@/lib/api-cache";
import { rateLimiter } from "@/lib/rate-limiter";
import { getSyncConfig, getDigiflazzRateLimitKey } from "@/lib/sync-config";

/**
 * GET /api/admin/sync-prices
 * Check sync status and trigger sync if needed
 */
export async function GET(request: NextRequest) {
  try {
    // Verify admin access
    await requireAdmin();

    const { searchParams } = new URL(request.url);
    const force = searchParams.get("force") === "true";
    const clearCache = searchParams.get("clearCache") === "true";
    const clearRateLimit = searchParams.get("clearRateLimit") === "true";
    const statusOnly = searchParams.get("statusOnly") === "true";
    const cmdParam = searchParams.get("cmd") || "full";
    const cmd = Object.values(PriceSyncType).includes(cmdParam.toUpperCase() as PriceSyncType)
      ? (cmdParam.toUpperCase() as PriceSyncType)
      : PriceSyncType.FULL;

    // Clear cache if requested
    if (clearCache) {
      apiCache.clear();
      console.log("[Sync] Cache cleared");
    }

    // Clear rate limit if requested (useful in development)
    if (clearRateLimit) {
      rateLimiter.reset(getDigiflazzRateLimitKey("price-list"));
      console.log("[Sync] Rate limit cleared");
    }

    // Get last sync status
    const lastSync = await getLastSyncStatus();
    const config = getSyncConfig();

    // Check rate limit status
    const rateLimitStatus = rateLimiter.status(getDigiflazzRateLimitKey("price-list"));
    const cacheStats = apiCache.stats();

    // Check if sync is needed (only if not statusOnly)
    const syncNeeded = !statusOnly && (force || (await isPriceSyncNeeded()));

    // If status only, return without triggering sync
    if (statusOnly || (!syncNeeded && !force)) {
      return NextResponse.json({
        success: true,
        message: statusOnly ? "Status check only" : "Prices are up to date",
        lastSync,
        syncNeeded: statusOnly ? await isPriceSyncNeeded() : false,
        config: {
          environment: config.logDebugInfo ? "development" : "production",
          cacheTtlMinutes: Math.round(config.cacheTtlMs / 60000),
          rateLimitMinutes: Math.round(config.rateLimit.windowMs / 60000),
        },
        rateLimit: rateLimitStatus,
        cache: cacheStats,
      });
    }

    // Check if sync is already in progress
    const inProgressSync = await db.priceSync.findFirst({
      where: {
        status: PriceSyncStatus.IN_PROGRESS,
        startedAt: {
          gte: new Date(Date.now() - 10 * 60 * 1000), // Within last 10 minutes
        },
      },
    });

    if (inProgressSync && !force) {
      return NextResponse.json({
        success: false,
        message: "Sync already in progress",
        lastSync: {
          ...inProgressSync,
          ageMinutes: Math.floor(
            (new Date().getTime() - inProgressSync.startedAt.getTime()) /
            (1000 * 60)
          ),
        },
        rateLimit: rateLimitStatus,
        cache: cacheStats,
      });
    }

    // Check rate limit before syncing
    const { allowed, waitMs } = rateLimiter.check(
      getDigiflazzRateLimitKey("price-list"),
      config.rateLimit
    );

    if (!allowed && !clearRateLimit && !force) {
      const waitMinutes = Math.ceil(waitMs / 60000);
      return NextResponse.json({
        success: false,
        message: `Rate limit reached. Please wait ${waitMinutes} minute(s) or use clearRateLimit=true parameter.`,
        waitMs,
        waitMinutes,
        rateLimit: rateLimitStatus,
        cache: cacheStats,
      });
    }

    // Create sync record
    const syncRecord = await db.priceSync.create({
      data: {
        syncType: cmd,
        status: PriceSyncStatus.IN_PROGRESS,
        startedAt: new Date(),
      },
    });

    // Check if this is first sync (auto-create products)
    const firstSync = await isFirstSync();

    // Start sync in background (don't await)
    syncPricesFromDigiflazz(cmd, firstSync)
      .then(async (result) => {
        await db.priceSync.update({
          where: { id: syncRecord.id },
          data: {
            status: result.success ? PriceSyncStatus.SUCCESS : PriceSyncStatus.FAILED,
            itemsSynced: result.itemsSynced,
            itemsUpdated: result.itemsUpdated,
            itemsCreated: result.itemsCreated,
            errorMessage: result.error,
            completedAt: new Date(),
          },
        });
      })
      .catch(async (error) => {
        await db.priceSync.update({
          where: { id: syncRecord.id },
          data: {
            status: PriceSyncStatus.FAILED,
            errorMessage:
              error instanceof Error ? error.message : "Unknown error",
            completedAt: new Date(),
          },
        });
      });

    return NextResponse.json({
      success: true,
      message: "Price sync started in background",
      syncId: syncRecord.id,
      lastSync: {
        ...syncRecord,
        ageMinutes: 0,
      },
      config: {
        environment: config.logDebugInfo ? "development" : "production",
        cacheTtlMinutes: Math.round(config.cacheTtlMs / 60000),
        rateLimitMinutes: Math.round(config.rateLimit.windowMs / 60000),
        useMockData: config.useMockData,
      },
      rateLimit: rateLimitStatus,
      cache: cacheStats,
    });
  } catch (error) {
    console.error("Sync prices error:", error);
    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error ? error.message : "Failed to sync prices",
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/sync-prices
 * Force immediate sync (synchronous, waits for completion)
 * Accepts optional JSON data in body: { cmd?: string, jsonData?: { prepaid?: [], pasca?: [] }, autoCreate?: boolean }
 */
export async function POST(request: NextRequest) {
  try {
    // Verify admin access
    await requireAdmin();

    const body = await request.json().catch(() => ({}));
    const cmdParam = body.cmd || "full";
    const cmd = Object.values(PriceSyncType).includes(cmdParam.toUpperCase() as PriceSyncType)
      ? (cmdParam.toUpperCase() as PriceSyncType)
      : PriceSyncType.FULL;

    // Check if JSON data is provided
    const jsonData = body.jsonData ? {
      prepaid: body.jsonData.prepaid || undefined,
      pasca: body.jsonData.pasca || undefined,
    } : undefined;

    // Determine autoCreate: use body.autoCreate if provided, otherwise check if first sync
    const autoCreate = body.autoCreate !== undefined
      ? Boolean(body.autoCreate)
      : await isFirstSync();

    // Create sync record
    const syncRecord = await db.priceSync.create({
      data: {
        syncType: cmd,
        status: PriceSyncStatus.IN_PROGRESS,
        startedAt: new Date(),
      },
    });

    // Run sync synchronously with optional JSON data
    const result = await syncPricesFromDigiflazz(cmd, autoCreate, jsonData);

    // Update sync record
    await db.priceSync.update({
      where: { id: syncRecord.id },
      data: {
        status: result.success ? PriceSyncStatus.SUCCESS : PriceSyncStatus.FAILED,
        itemsSynced: result.itemsSynced,
        itemsUpdated: result.itemsUpdated,
        itemsCreated: result.itemsCreated,
        errorMessage: result.error,
        completedAt: new Date(),
      },
    });

    return NextResponse.json({
      success: result.success,
      message: result.success
        ? `Synced ${result.itemsSynced} items, updated ${result.itemsUpdated}`
        : result.error || "Sync failed",
      result: {
        itemsSynced: result.itemsSynced,
        itemsUpdated: result.itemsUpdated,
        itemsCreated: result.itemsCreated,
        itemsSkipped: result.itemsSkipped,
      },
    });
  } catch (error) {
    console.error("Sync prices error:", error);
    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error ? error.message : "Failed to sync prices",
      },
      { status: 500 }
    );
  }
}

