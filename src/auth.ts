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

    if (!session || !session.user) {
      return null;
    }

    // Fetch user from database to get role (BetterAuth might not include custom fields in session)
    const user = await db.user.findUnique({
      where: { id: session.user.id },
      select: { role: true },
    });

    // Transform BetterAuth session to match NextAuth format for compatibility
    return {
      user: {
        id: session.user.id,
        email: session.user.email ?? null,
        name: session.user.name ?? null,
        image: session.user.image ?? null,
        role: user?.role || UserRole.USER,
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
