import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { db } from "@/server/db";
import { hashPassword } from "@/lib/password";

const ResetPasswordSchema = z.object({
  token: z.string().min(1, "Token is required"),
  email: z.string().email("Invalid email"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = ResetPasswordSchema.parse(body);

    // Find verification token
    const verificationToken = await (db as any).verificationToken.findUnique({
      where: {
        identifier_token: {
          identifier: validatedData.email,
          token: validatedData.token,
        },
      },
    });

    if (!verificationToken) {
      return NextResponse.json(
        { success: false, message: "Invalid or expired reset token" },
        { status: 400 }
      );
    }

    // Check if token is expired
    if (verificationToken.expires < new Date()) {
      // Delete expired token
      await (db as any).verificationToken.delete({
        where: {
          identifier_token: {
            identifier: validatedData.email,
            token: validatedData.token,
          },
        },
      });
      return NextResponse.json(
        { success: false, message: "Reset token has expired. Please request a new one." },
        { status: 400 }
      );
    }

    // Find user
    const user = await db.user.findUnique({
      where: { email: validatedData.email },
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

    // Hash new password
    const hashedPassword = await hashPassword(validatedData.password);

    // Update user password
    await db.user.update({
      where: { email: validatedData.email },
      data: {
        password: hashedPassword,
      },
    });

    // Delete the used token
    await (db as any).verificationToken.delete({
      where: {
        identifier_token: {
          identifier: validatedData.email,
          token: validatedData.token,
        },
      },
    });

    console.log("Password reset successful for:", validatedData.email);

    return NextResponse.json(
      {
        success: true,
        message: "Password has been reset successfully",
      },
      { status: 200 }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, message: error.errors[0]?.message || "Validation error" },
        { status: 400 }
      );
    }

    console.error("Reset password error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to reset password" },
      { status: 500 }
    );
  }
}

