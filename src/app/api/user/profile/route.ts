import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { db } from "@/server/db";
import { getServerAuthSession } from "@/auth";

const UpdateProfileSchema = z.object({
  name: z.string().min(1, "Name is required").max(100, "Name is too long"),
  phone: z.string().optional(),
});

export async function GET(request: NextRequest) {
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
        phone: true,
        image: true,
        role: true,
        emailVerified: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, message: "User not found" },
        { status: 404 }
      );
    }

    // Check if user has password account (BetterAuth stores password in Account model)
    // BetterAuth uses "credential" (singular) for email/password accounts
    const accounts = await db.account.findMany({
      where: { userId: session.user.id },
      select: { 
        providerId: true,
        password: true, // Check if account has password
      },
    });
    
    // User has password if they have a credential account with a password
    const credentialAccount = accounts.find((acc) => acc.providerId === "credential");
    const hasPassword = !!credentialAccount?.password;
    
    // User is OAuth-only if they have accounts but no credential account with password
    const isOAuthOnly = accounts.length > 0 && !hasPassword;
    const hasGoogleAccount = accounts.some((acc) => acc.providerId === "google");

    return NextResponse.json(
      {
        success: true,
        user: {
          ...user,
          hasPassword,
          isOAuthOnly,
          hasGoogleAccount,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Get profile error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to get profile" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerAuthSession();

    if (!session) {
      return NextResponse.json(
        { success: false, message: "Not authenticated" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const validatedData = UpdateProfileSchema.parse(body);

    const updatedUser = await db.user.update({
      where: { id: session.user.id },
      data: {
        name: validatedData.name,
        phone: validatedData.phone || null,
      },
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        image: true,
        role: true,
        emailVerified: true,
      },
    });

    return NextResponse.json(
      {
        success: true,
        message: "Profile updated successfully",
        user: updatedUser,
      },
      { status: 200 }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, message: error.issues[0]?.message || "Validation error" },
        { status: 400 }
      );
    }

    console.error("Update profile error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to update profile" },
      { status: 500 }
    );
  }
}
