import { NextResponse, type NextRequest } from "next/server";
import { requireAdmin } from "@/lib/auth-helpers";
import { db } from "@/server/db";
import { hashPassword } from "@/lib/password";
import { UserRole } from "@prisma/client";

/**
 * GET /api/admin/users
 * Fetch all users
 */
export async function GET(request: NextRequest) {
  try {
    await requireAdmin();

    const users = await db.user.findMany({
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
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json({
      success: true,
      data: users,
    });
  } catch (error) {
    console.error("Get users error:", error);
    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error ? error.message : "Failed to get users",
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/users
 * Create a new user
 */
export async function POST(request: NextRequest) {
  try {
    await requireAdmin();

    const body = await request.json();
    const { email, name, password, phone, role, emailVerified } = body;

    if (!email) {
      return NextResponse.json(
        {
          success: false,
          message: "Email is required",
        },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existingUser = await db.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        {
          success: false,
          message: "User with this email already exists",
        },
        { status: 400 }
      );
    }

    // Hash password if provided
    const hashedPassword = password ? await hashPassword(password) : null;

    const user = await db.user.create({
      data: {
        email,
        name: name || null,
        password: hashedPassword,
        phone: phone || null,
        role: role === "ADMIN" ? UserRole.ADMIN : UserRole.USER,
        emailVerified: emailVerified !== undefined ? emailVerified : false,
      },
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
    console.error("Create user error:", error);
    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error ? error.message : "Failed to create user",
      },
      { status: 500 }
    );
  }
}

