import { PrismaClient } from "@prisma/client";

/**
 * Reset Data Utility Script
 * 
 * Usage:
 *   npm run reset:data  (shows current counts)
 *   npm run reset:data -- --confirm  (performs the reset)
 */

const prisma = new PrismaClient();

async function getRecordCounts() {
    try {
        console.log("📊 Fetching record counts from database...\n");

        const [orderCount, paymentCount, digiflazzCount, couponUsageCount, apiLogCount] =
            await Promise.all([
                prisma.order.count(),
                prisma.payment.count(),
                prisma.digiflazzTransaction.count(),
                prisma.couponUsage.count(),
                prisma.apiLog.count(),
            ]);

        const counts = {
            orders: orderCount,
            payments: paymentCount,
            digiflazzTransactions: digiflazzCount,
            couponUsages: couponUsageCount,
            apiLogs: apiLogCount,
        };

        console.log("📈 Current Record Counts:");
        console.log("========================");
        Object.entries(counts).forEach(([key, count]) => {
            console.log(`  ${key.padEnd(25)}: ${count}`);
        });

        return counts;
    } catch (error) {
        console.error("❌ Failed to fetch counts:", error);
        throw error;
    }
}

async function resetData(confirm: boolean) {
    try {
        const counts = await getRecordCounts();
        const total = Object.values(counts).reduce((a, b) => a + b, 0);

        if (total === 0) {
            console.log("\n✅ No records to reset - database is already clean!");
            return;
        }

        if (!confirm) {
            console.log(`\n⚠️  WARNING: This will delete ${total} records!`);
            console.log("\nTo confirm the reset, call this command with --confirm flag:");
            console.log("  npm run reset:data -- --confirm\n");
            return;
        }

        console.log(`\n🔄 Deleting ${total} records...\n`);

        // Delete in correct order to respect foreign keys
        console.log("=== STARTING DATA RESET ===");

        // 1. Delete DigiflazzTransaction records
        const digiflazzDeleted = await prisma.digiflazzTransaction.deleteMany({});
        console.log(`  ✓ Deleted ${digiflazzDeleted.count} Digiflazz transactions`);

        // 2. Delete Payment records
        const paymentsDeleted = await prisma.payment.deleteMany({});
        console.log(`  ✓ Deleted ${paymentsDeleted.count} payments`);

        // 3. Delete CouponUsage records
        const couponUsageDeleted = await prisma.couponUsage.deleteMany({});
        console.log(`  ✓ Deleted ${couponUsageDeleted.count} coupon usages`);

        // 4. Delete ApiLog records
        const apiLogsDeleted = await prisma.apiLog.deleteMany({});
        console.log(`  ✓ Deleted ${apiLogsDeleted.count} API logs`);

        // 5. Delete Order records
        const ordersDeleted = await prisma.order.deleteMany({});
        console.log(`  ✓ Deleted ${ordersDeleted.count} orders`);

        console.log("\n✅ Reset Complete!");
        console.log("==================");
        console.log(`Total records deleted: ${digiflazzDeleted.count +
            paymentsDeleted.count +
            couponUsageDeleted.count +
            apiLogsDeleted.count +
            ordersDeleted.count
            }\n`);

    } catch (error) {
        console.error("\n❌ Failed to reset data:", error);
        throw error;
    } finally {
        await prisma.$disconnect();
    }
}

// Main
const confirm = process.argv.includes("--confirm");

resetData(confirm)
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
