import { PrismaAdapter } from "@auth/prisma-adapter";
import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import { db } from "@/server/db";
import { env } from "@/env";
import { verifyPassword } from "@/lib/password";
import { UserRole } from "@prisma/client";

/**
 * Module augmentation for `next-auth` types. Allows us to add custom properties to the `session`
 * object and keep type safety.
 */
declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: UserRole;
    } & {
      name?: string | null;
      email?: string | null;
      image?: string | null;
    };
  }

  interface User {
    role: UserRole;
  }
}

export const { handlers, signIn, signOut, auth } = NextAuth({
  adapter: PrismaAdapter(db) as any,
  session: {
    strategy: "jwt", // Use JWT for better credentials support
  },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  providers: [
    Google({
      clientId: env.GOOGLE_CLIENT_ID,
      clientSecret: env.GOOGLE_CLIENT_SECRET,
    }),
    Credentials({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Email and password are required");
        }

        const user = await db.user.findUnique({
          where: { email: String(credentials.email) },
        });

        if (!user) {
          throw new Error("Invalid email or password");
        }

        // OAuth users (Google) don't have passwords
        if (!user.password) {
          throw new Error("This account uses Google sign-in. Please sign in with Google instead.");
        }

        const isPasswordValid = await verifyPassword(
          String(credentials.password),
          user.password
        );

        if (!isPasswordValid) {
          throw new Error("Invalid email or password");
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.image,
          role: user.role,
        };
      },
    }),
  ],
  callbacks: {
    async signIn({ user, account, profile }) {
      // Handle Google OAuth - link accounts if user already exists
      if (account?.provider === "google" && user.email && account.providerAccountId) {
        // Check if this Google account (providerAccountId) is already linked to ANY user
        const existingAccount = await (db as any).account.findFirst({
          where: {
            provider: "google",
            providerAccountId: account.providerAccountId,
          },
          include: {
            user: {
              select: {
                id: true,
                email: true,
              },
            },
          },
        });

        const existingUser = await db.user.findUnique({
          where: { email: user.email },
        });

        // If Google account is already linked to a different user
        if (existingAccount && existingUser && existingAccount.user.id !== existingUser.id) {
          // This Google account is already linked to another user account
          // NextAuth will throw OAuthAccountNotLinked error automatically
          // We'll return false to prevent sign in
          return false;
        }

        // If Google account is already linked to a different email (but no user exists with current email)
        if (existingAccount && !existingUser && existingAccount.user.email !== user.email) {
          // This Google account is already linked to another user account
          return false;
        }

        // If user exists, check if Google account is already linked to this user
        if (existingUser) {
          const userGoogleAccount = await (db as any).account.findFirst({
            where: {
              userId: existingUser.id,
              provider: "google",
            },
          });

          // If Google account not linked, link it to existing user
          if (!userGoogleAccount && account.providerAccountId) {
            await (db as any).account.create({
              data: {
                userId: existingUser.id,
                type: account.type,
                provider: account.provider,
                providerAccountId: account.providerAccountId,
                access_token: account.access_token ?? null,
                expires_at: account.expires_at ?? null,
                token_type: account.token_type ?? null,
                scope: account.scope ?? null,
                id_token: account.id_token ?? null,
                session_state: account.session_state ?? null,
              },
            });
          }

          // Update user info if needed (keep existing password)
          await db.user.update({
            where: { email: user.email },
            data: {
              name: existingUser.name || user.name || undefined,
              image: existingUser.image || user.image || undefined,
              emailVerified: existingUser.emailVerified || new Date(),
            },
          });

          // Return true to allow sign in - account is now linked
          return true;
        }

        // If user doesn't exist, PrismaAdapter will create it
        // We'll ensure emailVerified is set in the session callback
      }
      return true;
    },
    async jwt({ token, user, account }) {
      // Initial sign in
      if (user) {
        token.id = user.id;
        token.role = (user as any).role || UserRole.USER;
        token.email = user.email ?? null;
        token.name = user.name ?? null;
        token.image = user.image ?? null;
      }
      
      // For OAuth (Google), ensure emailVerified is set
      if (account?.provider === "google" && user?.id) {
        const dbUser = await db.user.findUnique({
          where: { id: user.id },
        });
        
        if (dbUser && !dbUser.emailVerified) {
          await db.user.update({
            where: { id: user.id },
            data: {
              emailVerified: new Date(),
            },
          });
        }
      }
      
      return token;
    },
    async session({ session, token }) {
      if (session.user && token.id && typeof token.id === "string") {
        session.user.id = token.id;
        session.user.role = (token.role as UserRole) || UserRole.USER;
        // Type assertion needed due to NextAuth type definitions
        (session.user as any).email = token.email ?? null;
        (session.user as any).name = token.name ?? null;
        (session.user as any).image = token.image ?? null;
      }
      return session;
    },
  },
  secret: env.AUTH_SECRET,
});

/**
 * Wrapper for getting the current session
 */
export const getServerAuthSession = async () => {
  return await auth();
};
