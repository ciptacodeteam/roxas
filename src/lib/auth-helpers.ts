import { getServerAuthSession } from "@/auth";
import { UserRole } from "@prisma/client";
import { redirect } from "next/navigation";

/**
 * Get the current session on the server
 */
export async function getSession() {
  return await getServerAuthSession();
}

/**
 * Require authentication - redirects to login if not authenticated
 */
export async function requireAuth() {
  const session = await getSession();
  if (!session) {
    redirect("/login");
  }
  return session;
}

/**
 * Require admin role - redirects to login if not admin
 */
export async function requireAdmin() {
  const session = await requireAuth();
  if (session.user.role !== UserRole.ADMIN) {
    redirect("/");
  }
  return session;
}

