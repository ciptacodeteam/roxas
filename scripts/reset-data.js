#!/usr/bin/env node

/**
 * Reset Data Utility Script
 * 
 * Usage:
 *   npm run reset:data  (shows current counts)
 *   npm run reset:data -- --confirm  (performs the reset)
 */

const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
const API_ENDPOINT = `${baseUrl}/api/admin/reset`;

async function getRecordCounts() {
    try {
        console.log(`📊 Fetching record counts from ${API_ENDPOINT}...`);
        const response = await fetch(API_ENDPOINT);
        const data = await response.json();

        if (!response.ok) {
            console.error("❌ Error:", data.message);
            process.exit(1);
        }

        console.log("\n📈 Current Record Counts:");
        console.log("========================");
        Object.entries(data.counts).forEach(([key, count]) => {
            console.log(`  ${key.padEnd(25)}: ${count}`);
        });
        console.log("\n💡 " + data.message);
        return data.counts;
    } catch (error) {
        console.error("❌ Failed to fetch counts:", error);
        process.exit(1);
    }
}

async function resetData() {
    try {
        const counts = await getRecordCounts();
        const total = Object.values(counts).reduce((a, b) => a + b, 0);

        if (total === 0) {
            console.log("✅ No records to reset - database is already clean!");
            return;
        }

        console.log(`\n⚠️  WARNING: This will delete ${total} records!`);
        console.log("\nTo confirm the reset, call this command with --confirm flag:");
        console.log("  npm run reset:data -- --confirm");
    } catch (error) {
        console.error("❌ Error:", error);
        process.exit(1);
    }
}

async function confirmReset() {
    try {
        console.log("\n🔄 Performing reset...");
        const response = await fetch(API_ENDPOINT, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ confirm: "RESET_ALL_DATA" }),
        });

        const data = await response.json();

        if (!response.ok) {
            console.error("❌ Error:", data.message);
            process.exit(1);
        }

        console.log("\n✅ Reset Complete!");
        console.log("==================");
        Object.entries(data.deleted).forEach(([key, count]) => {
            if (count > 0) {
                console.log(`  ✓ Deleted ${count} ${key}`);
            }
        });
    } catch (error) {
        console.error("❌ Failed to reset data:", error);
        process.exit(1);
    }
}

// Main
const confirm = process.argv.includes("--confirm");

if (confirm) {
    confirmReset();
} else {
    resetData();
}
