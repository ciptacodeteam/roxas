import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { db } from "@/server/db";
import { hashPassword } from "@/lib/password";
import { UserRole } from "@prisma/client";
import { sendEmail } from "@/lib/mailgun";
import { getWelcomeEmailTemplate } from "@/lib/email-templates";

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

    // Hash password
    const hashedPassword = await hashPassword(validatedData.password);

    // Create user
    const user = await db.user.create({
      data: {
        email: validatedData.email,
        password: hashedPassword,
        name: validatedData.name,
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

    // Send welcome email (don't wait for it to complete)
    const baseUrl = process.env.AUTH_URL || process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    sendEmail({
      to: user.email,
      subject: "Selamat Datang di Roxas Store! 🎮",
      html: getWelcomeEmailTemplate(user.name, user.email, baseUrl),
    })
      .then((result) => {
        console.log("Welcome email sent successfully:", result);
      })
      .catch((error) => {
        console.error("Failed to send welcome email:", {
          error: error?.message || error,
          stack: error?.stack,
          userEmail: user.email,
        });
        // Don't fail registration if email fails
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
        { success: false, message: error.errors[0]?.message || "Validation error" },
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

