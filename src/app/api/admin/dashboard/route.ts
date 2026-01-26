import { NextResponse, type NextRequest } from "next/server";
import { requireAdmin } from "@/lib/auth-helpers";
import { db } from "@/server/db";
import { getApiHealthStatus } from "@/lib/api-logger";

/**
 * GET /api/admin/dashboard
 * Get dashboard statistics with real-time notifications
 */
export async function GET(request: NextRequest) {
  try {
    await requireAdmin();

    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);
    const last24Hours = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const last7Days = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    // Run all queries in parallel for better performance
    const [
      totalRevenue,
      todayRevenue,
      thisMonthRevenue,
      lastMonthRevenue,
      totalOrders,
      todayOrders,
      completedOrders,
      pendingOrders,
      processingOrders,
      failedOrders,
      totalProducts,
      totalProductItems,
      totalUsers,
      newUsersThisMonth,
      latestTransactions,
      failedTransactions,
      recentAuditLogs,
      pendingOrdersNeedingAttention,
      newOrdersLast24h,
    ] = await Promise.all([
      // Total Revenue (from completed orders)
      db.order.aggregate({
        where: { status: "COMPLETED" },
        _sum: { totalAmount: true },
      }),
      // Today's Revenue
      db.order.aggregate({
        where: {
          status: "COMPLETED",
          createdAt: { gte: startOfToday },
        },
        _sum: { totalAmount: true },
      }),
      // This Month's Revenue
      db.order.aggregate({
        where: {
          status: "COMPLETED",
          createdAt: { gte: startOfMonth },
        },
        _sum: { totalAmount: true },
      }),
      // Last Month's Revenue
      db.order.aggregate({
        where: {
          status: "COMPLETED",
          createdAt: {
            gte: startOfLastMonth,
            lte: endOfLastMonth,
          },
        },
        _sum: { totalAmount: true },
      }),
      // Total Orders
      db.order.count(),
      // Today's Orders
      db.order.count({
        where: { createdAt: { gte: startOfToday } },
      }),
      // Completed Orders
      db.order.count({ where: { status: "COMPLETED" } }),
      // Pending Orders
      db.order.count({ where: { status: "PENDING" } }),
      // Processing Orders
      db.order.count({ where: { status: "PROCESSING" } }),
      // Failed Orders (current month)
      db.order.count({
        where: {
          status: "FAILED",
          createdAt: { gte: startOfMonth },
        },
      }),
      // Total Products
      db.product.count({ where: { isActive: true } }),
      // Total Product Items
      db.productItem.count({ where: { isActive: true } }),
      // Total Users
      db.user.count(),
      // New Users This Month
      db.user.count({
        where: { createdAt: { gte: startOfMonth } },
      }),
      // Latest transactions for current month (max 20)
      db.order.findMany({
        where: {
          createdAt: { gte: startOfMonth },
        },
        take: 20,
        orderBy: { createdAt: "desc" },
        include: {
          user: {
            select: { id: true, email: true, name: true },
          },
          productItem: {
            select: {
              id: true,
              name: true,
              product: {
                select: { id: true, name: true },
              },
            },
          },
          payment: {
            select: { id: true, status: true, amount: true },
          },
        },
      }),
      // Failed transactions (current month with details)
      db.order.findMany({
        where: {
          status: { in: ["FAILED", "EXPIRED"] },
          createdAt: { gte: startOfMonth },
        },
        take: 10,
        orderBy: { createdAt: "desc" },
        include: {
          user: {
            select: { id: true, email: true, name: true },
          },
          productItem: {
            select: {
              id: true,
              name: true,
              product: {
                select: { id: true, name: true },
              },
            },
          },
          digiflazzTx: {
            select: { status: true, message: true },
          },
        },
      }),
      // Recent audit logs (API errors and important actions)
      db.auditLog.findMany({
        take: 15,
        orderBy: { createdAt: "desc" },
        include: {
          user: {
            select: { id: true, email: true, name: true },
          },
        },
      }),
      // Pending orders that might need attention (older than 1 hour)
      db.order.count({
        where: {
          status: "PENDING",
          createdAt: { lt: new Date(now.getTime() - 60 * 60 * 1000) },
        },
      }),
      // New orders in last 24 hours
      db.order.count({
        where: { createdAt: { gte: last24Hours } },
      }),
    ]);

    // Recent API logs (last 24 hours) - separate query to handle potential errors
    let recentApiLogs: any[] = [];
    try {
      recentApiLogs = await db.apiLog.findMany({
        take: 30,
        orderBy: { createdAt: "desc" },
        where: {
          createdAt: { gte: last24Hours },
        },
      });
    } catch (apiLogError) {
      console.warn("Failed to fetch API logs (might need Prisma regeneration):", apiLogError);
    }

    // Sales data for the current month (for chart) - optimized with a single query
    const salesDataRaw = await db.order.groupBy({
      by: ["createdAt"],
      where: {
        status: "COMPLETED",
        createdAt: {
          gte: startOfMonth,
        },
      },
      _sum: { totalAmount: true },
    });

    // Process sales data into daily aggregates
    const salesByDate = new Map<string, number>();
    salesDataRaw.forEach((item) => {
      const dateKey = item.createdAt.toISOString().split("T")[0] as string;
      salesByDate.set(dateKey, (salesByDate.get(dateKey) || 0) + (item._sum.totalAmount || 0));
    });

    // Generate data for each day of the current month (from 1st to today)
    const salesData: { date: string; revenue: number }[] = [];
    const currentDay = now.getDate();
    for (let day = 1; day <= currentDay; day++) {
      const date = new Date(now.getFullYear(), now.getMonth(), day);
      const dateKey = date.toISOString().split("T")[0] as string;
      salesData.push({
        date: dateKey,
        revenue: salesByDate.get(dateKey) || 0,
      });
    }

    // Calculate revenue growth percentage
    const revenueGrowth =
      lastMonthRevenue._sum.totalAmount && thisMonthRevenue._sum.totalAmount
        ? ((thisMonthRevenue._sum.totalAmount - lastMonthRevenue._sum.totalAmount) /
          lastMonthRevenue._sum.totalAmount) *
        100
        : 0;

    // Calculate notification counts
    const notifications = {
      newOrders: newOrdersLast24h,
      pendingAttention: pendingOrdersNeedingAttention,
      failedTransactions: failedOrders,
      processing: processingOrders,
    };

    // Get API health status (run separately to not block main queries)
    let apiHealth: any = null;
    try {
      apiHealth = await getApiHealthStatus();
    } catch (err) {
      console.error("Failed to get API health status:", err);
    }

    return NextResponse.json({
      success: true,
      data: {
        revenue: {
          total: totalRevenue._sum.totalAmount || 0,
          today: todayRevenue._sum.totalAmount || 0,
          thisMonth: thisMonthRevenue._sum.totalAmount || 0,
          lastMonth: lastMonthRevenue._sum.totalAmount || 0,
          growth: Math.round(revenueGrowth * 100) / 100,
        },
        orders: {
          total: totalOrders,
          today: todayOrders,
          completed: completedOrders,
          pending: pendingOrders,
          processing: processingOrders,
          failed: failedOrders,
        },
        products: {
          total: totalProducts,
          items: totalProductItems,
        },
        users: {
          total: totalUsers,
          newThisMonth: newUsersThisMonth,
        },
        notifications,
        latestTransactions,
        failedTransactions,
        auditLogs: recentAuditLogs,
        apiLogs: recentApiLogs,
        salesData,
        apiHealth,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error("Get dashboard statistics error:", error);
    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error ? error.message : "Failed to get dashboard statistics",
      },
      { status: 500 }
    );
  }
}

