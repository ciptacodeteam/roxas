import { NextResponse, type NextRequest } from "next/server";
import { requireAdmin } from "@/lib/auth-helpers";
import { db } from "@/server/db";
import { queueVerificationEmail } from "@/lib/email-queue";
import { getVerificationEmailTemplate } from "@/lib/email-templates";
import { env } from "@/env";
import crypto from "crypto";

/**
 * POST /api/admin/users/[id]/send-verification
 * Send verification email to a user (admin only)
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
        emailVerified: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, message: "User not found" },
        { status: 404 }
      );
    }

    if (user.emailVerified) {
      return NextResponse.json(
        { success: false, message: "Email is already verified" },
        { status: 400 }
      );
    }

    // Generate verification token
    const token = crypto.randomBytes(32).toString("hex");
    const expires = new Date();
    expires.setHours(expires.getHours() + 24); // Token expires in 24 hours

    // Delete any existing tokens for this email first
    await db.verification.deleteMany({
      where: {
        identifier: user.email,
      },
    });

    // Create new verification token
    await db.verification.create({
      data: {
        identifier: user.email,
        value: token,
        expiresAt: expires,
      },
    });

    // Create verification URL
    const baseUrl = env.AUTH_URL || process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const verificationUrl = `${baseUrl}/api/user/verify-email?token=${token}&email=${encodeURIComponent(user.email)}`;

    // Queue verification email
    try {
      await queueVerificationEmail(
        user.email,
        getVerificationEmailTemplate(user.name, user.email, verificationUrl)
      );

      return NextResponse.json({
        success: true,
        message: "Verification email sent successfully",
      });
    } catch (emailError) {
      console.error("Failed to queue verification email:", emailError);
      return NextResponse.json(
        {
          success: false,
          message: "Failed to send verification email",
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Send verification error:", error);
    return NextResponse.json(
      {
        success: false,
        message: error instanceof Error ? error.message : "Failed to send verification email",
      },
      { status: 500 }
    );
  }
}

