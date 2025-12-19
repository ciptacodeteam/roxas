import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { db } from "@/server/db";
import { sendEmail } from "@/lib/mailgun";
import { getPasswordResetEmailTemplate } from "@/lib/email-templates";
import { env } from "@/env";
import crypto from "crypto";

const ForgotPasswordSchema = z.object({
  email: z.string().email("Invalid email"),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = ForgotPasswordSchema.parse(body);

    // Find user by email
    const user = await db.user.findUnique({
      where: { email: validatedData.email },
      select: {
        id: true,
        email: true,
        name: true,
        password: true, // Check if user has password (not OAuth only)
      },
    });

    // Always return success to prevent email enumeration
    // But only send email if user exists and has a password
    if (user && user.password) {
      // Generate reset token
      const token = crypto.randomBytes(32).toString("hex");
      const expires = new Date();
      expires.setHours(expires.getHours() + 1); // Token expires in 1 hour

      // Delete any existing tokens for this email first
      await (db as any).verificationToken.deleteMany({
        where: {
          identifier: user.email,
        },
      });

      // Create new reset token
      await (db as any).verificationToken.create({
        data: {
          identifier: user.email,
          token: token,
          expires: expires,
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

        console.log("Password reset email sent to:", user.email);
      } catch (emailError) {
        console.error("Failed to send password reset email:", emailError);
        // Don't fail the request, just log the error
      }
    } else {
      // Log for debugging but don't reveal if user exists
      console.log("Password reset requested for email (user not found or OAuth only):", validatedData.email);
    }

    // Always return success to prevent email enumeration
    return NextResponse.json(
      {
        success: true,
        message: "If an account with that email exists, a password reset link has been sent.",
      },
      { status: 200 }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      const firstError = error.issues[0];
      return NextResponse.json(
        { success: false, message: firstError?.message || "Validation error" },
        { status: 400 }
      );
    }

    console.error("Forgot password error:", error);
    // Still return success to prevent email enumeration
    return NextResponse.json(
      { success: true, message: "If an account with that email exists, a password reset link has been sent." },
      { status: 200 }
    );
  }
}

