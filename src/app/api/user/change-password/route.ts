import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { db } from "@/server/db";
import { getServerAuthSession } from "@/auth";
import { auth } from "@/auth";
import { headers } from "next/headers";

const ChangePasswordSchema = z.object({
  currentPassword: z.string().optional(), // Optional for OAuth-only users
  newPassword: z.string().min(8, "New password must be at least 8 characters"),
  confirmPassword: z.string().min(1, "Please confirm your new password"),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "New passwords do not match",
  path: ["confirmPassword"],
});

export async function POST(request: NextRequest) {
  try {
    const session = await getServerAuthSession();

    if (!session) {
      return NextResponse.json(
        { success: false, message: "Not authenticated" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const validatedData = ChangePasswordSchema.parse(body);

    // Get user
    const user = await db.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        email: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, message: "User not found" },
        { status: 404 }
      );
    }

    // Check if user has a credential account (email/password)
    // BetterAuth stores passwords in Account model with providerId = "credential"
    const accounts = await db.account.findMany({
      where: {
        userId: session.user.id,
      },
    });

    const credentialAccount = accounts.find((acc: any) => acc.providerId === "credential");
    const hasPassword = !!(credentialAccount as any)?.password;

    const headersList = await headers();

    // If user has password, use BetterAuth's changePassword API
    if (hasPassword) {
      if (!validatedData.currentPassword) {
        return NextResponse.json(
          { success: false, message: "Current password is required" },
          { status: 400 }
        );
      }

      // Use BetterAuth's changePassword API
      try {
        const changePasswordResult = await auth.api.changePassword({
          body: {
            currentPassword: validatedData.currentPassword,
            newPassword: validatedData.newPassword,
          },
          headers: headersList,
        });

        console.log("Change password result:", JSON.stringify(changePasswordResult, null, 2));

        // BetterAuth's changePassword may return different formats
        // Check for error in result
        const result = changePasswordResult as any;
        if (result?.error) {
          console.error("Change password API error:", result.error);
          return NextResponse.json(
            { success: false, message: result.error.message || result.error || "Failed to change password" },
            { status: 400 }
          );
        }

        // Password changed successfully via BetterAuth
        return NextResponse.json(
          {
            success: true,
            message: "Password changed successfully",
          },
          { status: 200 }
        );
      } catch (error: any) {
        console.error("Change password error:", error);
        console.error("Error details:", {
          message: error?.message,
          stack: error?.stack,
          name: error?.name,
        });
        
        // Check if it's a password verification error
        const errorMessage = error?.message || error?.toString() || "Current password is incorrect";
        return NextResponse.json(
          { success: false, message: errorMessage },
          { status: 400 }
        );
      }
    } else {
      // For OAuth-only users setting password for the first time
      // We'll use BetterAuth's signUpEmail to create a temporary user and get the password hash
      // Then use that hash format for the OAuth user's credential account
      try {
        // Create a temporary user with BetterAuth to get the password hash format
        const tempEmail = `temp_${Date.now()}_${Math.random().toString(36).substring(7)}@temp.com`;
        
        const tempSignUp = await auth.api.signUpEmail({
          body: {
            email: tempEmail,
            password: validatedData.newPassword,
            name: "Temp",
          },
          headers: headersList,
        });
        
        if (!tempSignUp.user) {
          return NextResponse.json(
            { success: false, message: "Failed to generate password hash" },
            { status: 500 }
          );
        }
        
        // Get the password hash from the temporary account
        const tempAccounts = await db.account.findMany({
          where: {
            userId: tempSignUp.user.id,
          },
        });
        
        const tempCredentialAccount = tempAccounts.find((acc: any) => acc.providerId === "credential");
        const passwordHash = (tempCredentialAccount as any)?.password;
        
        if (!passwordHash) {
          // Clean up temp user
          await db.account.deleteMany({
            where: { userId: tempSignUp.user.id },
          });
          await db.user.delete({
            where: { id: tempSignUp.user.id },
          });
          
          return NextResponse.json(
            { success: false, message: "Failed to generate password hash" },
            { status: 500 }
          );
        }
        
        // Create credential account for OAuth user with the password hash
        await db.account.create({
          data: {
            userId: session.user.id,
            providerId: "credential",
            accountId: user.email,
            password: passwordHash,
          } as any,
        });
        
        // Clean up temporary user and account
        await db.account.deleteMany({
          where: { userId: tempSignUp.user.id },
        });
        await db.user.delete({
          where: { id: tempSignUp.user.id },
        });
        
        return NextResponse.json(
          {
            success: true,
            message: "Password set successfully",
          },
          { status: 200 }
        );
      } catch (error: any) {
        console.error("Set password for OAuth user error:", error);
        return NextResponse.json(
          { success: false, message: error?.message || "Failed to set password" },
          { status: 500 }
        );
      }
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, message: error.issues[0]?.message || "Validation error" },
        { status: 400 }
      );
    }

    console.error("Change password error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to change password" },
      { status: 500 }
    );
  }
}

