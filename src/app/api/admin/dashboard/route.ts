import { NextResponse, type NextRequest } from "next/server";
import { requireAdmin } from "@/lib/auth-helpers";
import { db } from "@/server/db";

/**
 * GET /api/admin/dashboard
 * Get dashboard statistics
 */
export async function GET(request: NextRequest) {
  try {
    await requireAdmin();

    const now = new Date();
    const startOfToday = new Date(now.setHours(0, 0, 0, 0));
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);

    // Total Revenue (from completed orders)
    const totalRevenue = await db.order.aggregate({
      where: {
        status: "COMPLETED",
      },
      _sum: {
        totalAmount: true,
      },
    });

    // Today's Revenue
    const todayRevenue = await db.order.aggregate({
      where: {
        status: "COMPLETED",
        createdAt: {
          gte: startOfToday,
        },
      },
      _sum: {
        totalAmount: true,
      },
    });

    // This Month's Revenue
    const thisMonthRevenue = await db.order.aggregate({
      where: {
        status: "COMPLETED",
        createdAt: {
          gte: startOfMonth,
        },
      },
      _sum: {
        totalAmount: true,
      },
    });

    // Last Month's Revenue
    const lastMonthRevenue = await db.order.aggregate({
      where: {
        status: "COMPLETED",
        createdAt: {
          gte: startOfLastMonth,
          lte: endOfLastMonth,
        },
      },
      _sum: {
        totalAmount: true,
      },
    });

    // Total Orders
    const totalOrders = await db.order.count();

    // Today's Orders
    const todayOrders = await db.order.count({
      where: {
        createdAt: {
          gte: startOfToday,
        },
      },
    });

    // Completed Orders
    const completedOrders = await db.order.count({
      where: {
        status: "COMPLETED",
      },
    });

    // Pending Orders
    const pendingOrders = await db.order.count({
      where: {
        status: "PENDING",
      },
    });

    // Total Products
    const totalProducts = await db.product.count({
      where: {
        isActive: true,
      },
    });

    // Total Product Items
    const totalProductItems = await db.productItem.count({
      where: {
        isActive: true,
      },
    });

    // Total Users
    const totalUsers = await db.user.count();

    // New Users This Month
    const newUsersThisMonth = await db.user.count({
      where: {
        createdAt: {
          gte: startOfMonth,
        },
      },
    });

    // Get latest 10 orders (transactions)
    const latestTransactions = await db.order.findMany({
      take: 10,
      orderBy: {
        createdAt: "desc",
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
          },
        },
        productItem: {
          select: {
            id: true,
            name: true,
            product: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
        payment: {
          select: {
            id: true,
            status: true,
            amount: true,
          },
        },
      },
    });

    // Sales data for the last 30 days (for chart)
    const salesData = [];
    for (let i = 29; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);

      const dayRevenue = await db.order.aggregate({
        where: {
          status: "COMPLETED",
          createdAt: {
            gte: startOfDay,
            lte: endOfDay,
          },
        },
        _sum: {
          totalAmount: true,
        },
      });

      salesData.push({
        date: startOfDay.toISOString().split("T")[0],
        revenue: dayRevenue._sum.totalAmount || 0,
      });
    }

    // Calculate revenue growth percentage
    const revenueGrowth =
      lastMonthRevenue._sum.totalAmount && thisMonthRevenue._sum.totalAmount
        ? ((thisMonthRevenue._sum.totalAmount - lastMonthRevenue._sum.totalAmount) /
            lastMonthRevenue._sum.totalAmount) *
          100
        : 0;

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
        },
        products: {
          total: totalProducts,
          items: totalProductItems,
        },
        users: {
          total: totalUsers,
          newThisMonth: newUsersThisMonth,
        },
        latestTransactions,
        salesData,
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

