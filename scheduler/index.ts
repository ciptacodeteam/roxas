/**
 * Background Scheduler for Roxas
 * Handles periodic tasks like price synchronization
 */

import cron from "node-cron";
import { PriceSyncType } from "@prisma/client";
import { PrismaClient } from "@prisma/client";
import { syncPricesFromDigiflazz } from "../src/lib/sync-prices.js";

// Initialize Prisma Client
const db = new PrismaClient();

console.log("[Scheduler] Starting background worker...");

// Sync prices every 30 minutes
cron.schedule("*/30 * * * *", async () => {
  console.log("[Scheduler] Running automatic price sync...");
  try {
    const result = await syncPricesFromDigiflazz(PriceSyncType.FULL);
    console.log("[Scheduler] Price sync completed:", result);
  } catch (error) {
    console.error("[Scheduler] Price sync failed:", error);
  }
});

// Health check - ensure database connection
cron.schedule("*/5 * * * *", async () => {
  try {
    await db.$queryRaw`SELECT 1`;
    console.log("[Scheduler] Health check: OK");
  } catch (error) {
    console.error("[Scheduler] Health check failed:", error);
  }
});

// Cleanup old API logs (keep last 30 days)
cron.schedule("0 2 * * *", async () => {
  console.log("[Scheduler] Cleaning up old API logs...");
  try {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const deleted = await db.apiLog.deleteMany({
      where: {
        createdAt: {
          lt: thirtyDaysAgo,
        },
      },
    });

    console.log(`[Scheduler] Deleted ${deleted.count} old API logs`);
  } catch (error) {
    console.error("[Scheduler] API log cleanup failed:", error);
  }
});

// Cleanup expired sessions
cron.schedule("0 3 * * *", async () => {
  console.log("[Scheduler] Cleaning up expired sessions...");
  try {
    const deleted = await db.session.deleteMany({
      where: {
        expiresAt: {
          lt: new Date(),
        },
      },
    });

    console.log(`[Scheduler] Deleted ${deleted.count} expired sessions`);
  } catch (error) {
    console.error("[Scheduler] Session cleanup failed:", error);
  }
});

// Cleanup expired orders (delete pending orders older than 24 hours)
cron.schedule("0 4 * * *", async () => {
  console.log("[Scheduler] Cleaning up expired pending orders...");
  try {
    const oneDayAgo = new Date();
    oneDayAgo.setDate(oneDayAgo.getDate() - 1);

    const deleted = await db.order.deleteMany({
      where: {
        status: "PENDING",
        createdAt: {
          lt: oneDayAgo,
        },
      },
    });

    console.log(`[Scheduler] Deleted ${deleted.count} expired pending orders`);
  } catch (error) {
    console.error("[Scheduler] Order cleanup failed:", error);
  }
});

console.log("[Scheduler] All jobs scheduled successfully");
console.log("[Scheduler] Schedule:");
console.log("  - Price sync: Every 30 minutes");
console.log("  - Health check: Every 5 minutes");
console.log("  - API log cleanup: Daily at 2:00 AM");
console.log("  - Session cleanup: Daily at 3:00 AM");
console.log("  - Order cleanup: Daily at 4:00 AM");

// Graceful shutdown
async function shutdown() {
  console.log("[Scheduler] Shutting down gracefully...");
  await db.$disconnect();
  process.exit(0);
}

process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);
