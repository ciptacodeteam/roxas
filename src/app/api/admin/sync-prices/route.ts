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
    const cmdParam = searchParams.get("cmd") || "full";
    const cmd = Object.values(PriceSyncType).includes(cmdParam.toUpperCase() as PriceSyncType)
      ? (cmdParam.toUpperCase() as PriceSyncType)
      : PriceSyncType.FULL;

    // Get last sync status
    const lastSync = await getLastSyncStatus();

    // Check if sync is needed
    const syncNeeded = force || (await isPriceSyncNeeded(30));

    if (!syncNeeded && !force) {
      return NextResponse.json({
        success: true,
        message: "Prices are up to date",
        lastSync,
        syncNeeded: false,
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
      });
    }

    // Create sync record
    const syncRecord = await db.priceSync.create({
      data: {
        syncType: cmd,
        status: "in_progress",
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

    // Run sync synchronously
    const result = await syncPricesFromDigiflazz(cmd, firstSync);

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

