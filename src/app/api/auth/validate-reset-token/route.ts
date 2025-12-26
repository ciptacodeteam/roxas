import { NextResponse, type NextRequest } from "next/server";
import { db } from "@/server/db";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const token = searchParams.get("token");
    const email = searchParams.get("email");

    if (!token || !email) {
      return NextResponse.json(
        { success: false, message: "Token and email are required" },
        { status: 400 }
      );
    }

    // Find verification token (BetterAuth uses 'value' instead of 'token')
    const verification = await db.verification.findFirst({
      where: {
        identifier: email,
        value: token,
      },
    });

    if (!verification) {
      return NextResponse.json(
        { success: false, message: "Invalid or expired reset token" },
        { status: 400 }
      );
    }

    // Check if token is expired (BetterAuth uses 'expiresAt' instead of 'expires')
    if (verification.expiresAt < new Date()) {
      // Delete expired token
      await db.verification.delete({
        where: {
          id: verification.id,
        },
      });
      return NextResponse.json(
        { success: false, message: "Reset token has expired" },
        { status: 400 }
      );
    }

    // Check if user exists
    const user = await db.user.findUnique({
      where: { email: email },
      select: {
        id: true,
        email: true,
        password: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, message: "User not found" },
        { status: 404 }
      );
    }

    // Check if user has password (not OAuth only)
    if (!user.password) {
      return NextResponse.json(
        { success: false, message: "This account uses OAuth login and cannot reset password" },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: true, message: "Token is valid" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Validate reset token error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to validate token" },
      { status: 500 }
    );
  }
}

