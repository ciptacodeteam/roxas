import { NextResponse, type NextRequest } from "next/server";
import { requireAdmin } from "@/lib/auth-helpers";
import { db } from "@/server/db";
import { UserRole } from "@prisma/client";

/**
 * GET /api/admin/users/[id]
 * Get user details with related data
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();

    const { id } = await params;

    const user = await db.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        name: true,
        image: true,
        emailVerified: true,
        phone: true,
        role: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            orders: true,
            accounts: true,
            sessions: true,
            couponUsages: true,
          },
        },
        orders: {
          take: 5,
          orderBy: { createdAt: "desc" },
          select: {
            id: true,
            orderNumber: true,
            status: true,
            totalAmount: true,
            createdAt: true,
            productItem: {
              select: {
                name: true,
                product: {
                  select: {
                    name: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          message: "User not found",
        },
        { status: 404 }
      );
    }

    // Get additional stats
    const totalSpent = await db.order.aggregate({
      where: { userId: id, status: { in: ["PAID", "COMPLETED"] } },
      _sum: {
        totalAmount: true,
      },
    });

    const completedOrders = await db.order.count({
      where: { userId: id, status: "COMPLETED" },
    });

    return NextResponse.json({
      success: true,
      data: {
        ...user,
        stats: {
          totalSpent: totalSpent._sum.totalAmount || 0,
          completedOrders,
        },
      },
    });
  } catch (error) {
    console.error("Get user error:", error);
    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error ? error.message : "Failed to get user",
      },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/admin/users/[id]
 * Update a user
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();

    const { id } = await params;
    const body = await request.json();
    const { email, name, phone, role, emailVerified } = body;

    const updateData: {
      email?: string;
      name?: string | null;
      phone?: string | null;
      role?: UserRole;
      emailVerified?: boolean;
    } = {};

    if (email !== undefined) {
      // Check if email is already taken by another user
      const existingUser = await db.user.findUnique({
        where: { email },
      });

      if (existingUser && existingUser.id !== id) {
        return NextResponse.json(
          {
            success: false,
            message: "Email is already taken by another user",
          },
          { status: 400 }
        );
      }
      updateData.email = email;
    }

    if (name !== undefined) updateData.name = name || null;
    if (phone !== undefined) updateData.phone = phone || null;
    if (role !== undefined) {
      updateData.role = role === "ADMIN" ? UserRole.ADMIN : UserRole.USER;
    }
    if (emailVerified !== undefined) updateData.emailVerified = emailVerified;

    const user = await db.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        email: true,
        name: true,
        image: true,
        emailVerified: true,
        phone: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return NextResponse.json({
      success: true,
      data: user,
    });
  } catch (error) {
    console.error("Update user error:", error);
    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error ? error.message : "Failed to update user",
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/users/[id]
 * Delete a user
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();

    const { id } = await params;

    await db.user.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: "User deleted",
    });
  } catch (error) {
    console.error("Delete user error:", error);
    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error ? error.message : "Failed to delete user",
      },
      { status: 500 }
    );
  }
}

