import { NextResponse, type NextRequest } from "next/server";
import { requireAdmin } from "@/lib/auth-helpers";
import { db } from "@/server/db";
import { hashPassword } from "@/lib/password";
import { UserRole } from "@prisma/client";

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
    const { email, name, password, phone, role, emailVerified } = body;

    const updateData: {
      email?: string;
      name?: string | null;
      password?: string;
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

    // Only update password if provided
    if (password && password.trim() !== "") {
      updateData.password = await hashPassword(password);
    }

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

