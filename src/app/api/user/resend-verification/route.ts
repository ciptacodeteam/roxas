import { NextResponse, type NextRequest } from "next/server";
import { db } from "@/server/db";
import { getServerAuthSession } from "@/auth";
import { queueVerificationEmail } from "@/lib/email-queue";
import { getVerificationEmailTemplate } from "@/lib/email-templates";
import { env } from "@/env";
import crypto from "crypto";

export async function POST(request: NextRequest) {
  try {
    const session = await getServerAuthSession();

    if (!session) {
      return NextResponse.json(
        { success: false, message: "Not authenticated" },
        { status: 401 }
      );
    }

    const user = await db.user.findUnique({
      where: { id: session.user.id },
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
        { success: false, message: "Email already verified" },
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

    // Create new verification token (BetterAuth uses 'value' instead of 'token', 'expiresAt' instead of 'expires')
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
      console.log("Queueing verification email to:", user.email);
      const jobId = await queueVerificationEmail(
        user.email,
        getVerificationEmailTemplate(user.name, user.email, verificationUrl)
      );

      console.log("Verification email queued successfully:", { jobId, email: user.email });

      return NextResponse.json(
        {
          success: true,
          message: "Verification email sent successfully",
        },
        { status: 200 }
      );
    } catch (emailError: any) {
      console.error("Failed to queue verification email:", {
        error: emailError?.message || emailError,
        stack: emailError?.stack,
      });
      return NextResponse.json(
        {
          success: false,
          message: "Failed to send verification email. Please try again later.",
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Resend verification error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to send verification email" },
      { status: 500 }
    );
  }
}

