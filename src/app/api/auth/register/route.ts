import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { db } from "@/server/db";
import { auth } from "@/auth";
import { UserRole } from "@prisma/client";
import { queueWelcomeEmail } from "@/lib/email-queue";
import { getWelcomeEmailTemplate } from "@/lib/email-templates";
import { headers } from "next/headers";

const RegisterSchema = z.object({
  email: z.string().email("Invalid email"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  name: z.string().min(1, "Name is required").optional(),
  phone: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = RegisterSchema.parse(body);

    // Check if user already exists
    const existingUser = await db.user.findUnique({
      where: { email: validatedData.email },
    });

    if (existingUser) {
      return NextResponse.json(
        { success: false, message: "Email already registered" },
        { status: 400 }
      );
    }

    // Use BetterAuth's signUp API to create user with proper password hashing
    const headersList = await headers();
    try {
      const signUpResult = await auth.api.signUpEmail({
        body: {
          email: validatedData.email,
          password: validatedData.password,
          name: validatedData.name || "User", // BetterAuth requires name, provide default
        },
        headers: headersList,
      });

      // BetterAuth returns user object on success
      if (!signUpResult.user) {
        return NextResponse.json(
          { success: false, message: "Registration failed" },
          { status: 400 }
        );
      }
    } catch (error: any) {
      // BetterAuth throws error if registration fails
      return NextResponse.json(
        { success: false, message: error?.message || "Registration failed" },
        { status: 400 }
      );
    }

    // Update user with phone number and role (BetterAuth doesn't handle these)
    const user = await db.user.update({
      where: { email: validatedData.email },
      data: {
        phone: validatedData.phone,
        role: UserRole.USER,
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
      },
    });

    // Queue welcome email (async, non-blocking)
    const baseUrl = process.env.AUTH_URL || process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    queueWelcomeEmail(
      user.email,
      getWelcomeEmailTemplate(user.name, user.email, baseUrl)
    )
      .then((jobId) => {
        console.log("Welcome email queued successfully:", { jobId, email: user.email });
      })
      .catch((error) => {
        console.error("Failed to queue welcome email:", {
          error: error?.message || error,
          userEmail: user.email,
        });
        // Don't fail registration if email queueing fails
      });

    return NextResponse.json(
      {
        success: true,
        message: "Registration successful",
        user,
      },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, message: error.issues[0]?.message || "Validation error" },
        { status: 400 }
      );
    }

    console.error("Registration error:", error);
    return NextResponse.json(
      { success: false, message: "Registration failed" },
      { status: 500 }
    );
  }
}

