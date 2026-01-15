import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { db } from "@/server/db";
import { env } from "@/env";
import { UserRole } from "@prisma/client";

export const auth = betterAuth({
  database: prismaAdapter(db, {
    provider: "postgresql",
  }),
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false,
  },
  socialProviders: {
    google: {
      clientId: env.GOOGLE_CLIENT_ID,
      clientSecret: env.GOOGLE_CLIENT_SECRET,
    },
  },
  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 days
    updateAge: 60 * 60 * 24, // 1 day
  },
  secret: env.AUTH_SECRET,
  baseURL: env.AUTH_URL || "http://localhost:3000",
  basePath: "/api/auth",
  trustedOrigins: [
    "http://localhost:3000",
    ...(process.env.WEBHOOK_BASE_URL ? [process.env.WEBHOOK_BASE_URL] : []),
  ],
  user: {
    // Include additional user fields in the session
    additionalFields: {
      role: {
        type: "string",
        defaultValue: "USER",
        required: false,
        input: false, // Don't allow setting via API
      },
      phone: {
        type: "string",
        required: false,
        input: true,
      },
    },
  },
  // Note: Role is set via Prisma default value
  // Email verification for OAuth users can be handled via database triggers or in API routes
});

// Server-side session getter (compatible with existing code)
export async function getServerAuthSession() {
  try {
    const { headers } = await import("next/headers");
    const headersList = await headers();

    const session = await auth.api.getSession({
      headers: headersList,
    });

    if (!session?.user) {
      return null;
    }

    // Try to get role from session first (faster)
    let userRole = (session.user as any).role as UserRole | undefined;

    // If role not in session, fetch from database (fallback for older sessions)
    if (!userRole) {
      const user = await db.user.findUnique({
        where: { id: session.user.id },
        select: { role: true },
      });
      userRole = user?.role || UserRole.USER;
    }

    // Transform BetterAuth session to match NextAuth format for compatibility
    return {
      user: {
        id: session.user.id,
        email: session.user.email ?? null,
        name: session.user.name ?? null,
        image: session.user.image ?? null,
        role: userRole,
      },
      expires: session.session.expiresAt.toISOString(),
    };
  } catch (error) {
    console.error("Error getting session:", error);
    return null;
  }
}

// Export auth instance for use in API routes
export type Auth = typeof auth;
