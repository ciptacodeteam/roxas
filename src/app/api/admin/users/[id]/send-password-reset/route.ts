import { NextResponse, type NextRequest } from "next/server";
import { requireAdmin } from "@/lib/auth-helpers";
import { db } from "@/server/db";
import { sendEmail } from "@/lib/mailgun";
import { getPasswordResetEmailTemplate } from "@/lib/email-templates";
import { env } from "@/env";
import crypto from "crypto";

/**
 * POST /api/admin/users/[id]/send-password-reset
 * Send password reset email to a user (admin only)
 */
export async function POST(
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
        password: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, message: "User not found" },
        { status: 404 }
      );
    }

    if (!user.password) {
      return NextResponse.json(
        { success: false, message: "User uses OAuth login and cannot reset password" },
        { status: 400 }
      );
    }

    // Generate reset token
    const token = crypto.randomBytes(32).toString("hex");
    const expires = new Date();
    expires.setHours(expires.getHours() + 1); // Token expires in 1 hour

    // Delete any existing tokens for this email first
    await db.verification.deleteMany({
      where: {
        identifier: user.email,
      },
    });

    // Create new reset token
    await db.verification.create({
      data: {
        identifier: user.email,
        value: token,
        expiresAt: expires,
      },
    });

    // Create reset URL
    const baseUrl = env.AUTH_URL || process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const resetUrl = `${baseUrl}/reset-password?token=${token}&email=${encodeURIComponent(user.email)}`;

    // Send reset email
    try {
      await sendEmail({
        to: user.email,
        subject: "Reset Kata Sandi - Roxas Store",
        html: getPasswordResetEmailTemplate(user.name, user.email, resetUrl),
      });

      return NextResponse.json({
        success: true,
        message: "Password reset email sent successfully",
      });
    } catch (emailError) {
      console.error("Failed to send password reset email:", emailError);
      return NextResponse.json(
        {
          success: false,
          message: "Failed to send password reset email",
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Send password reset error:", error);
    return NextResponse.json(
      {
        success: false,
        message: error instanceof Error ? error.message : "Failed to send password reset email",
      },
      { status: 500 }
    );
  }
}

