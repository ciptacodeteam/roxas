"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth, useLogout } from "@/lib/auth";
import { toast } from "sonner";

/**
 * RoleGuard component to prevent admins from accessing public pages
 * and regular users from accessing admin pages
 */
export function RoleGuard({ type }: { type: "public" | "admin" }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, isAdmin, isLoading } = useAuth();
  const { logout } = useLogout({ redirectTo: "/id" });
  const [hasViolated, setHasViolated] = useState(false);
  const violationChecked = useRef(false);

  useEffect(() => {
    // Reset violation check when path changes
    violationChecked.current = false;
    setHasViolated(false);
  }, [pathname]);

  useEffect(() => {
    // Don't check while loading or if no user
    if (isLoading || !user) return;

    // Only check once per route
    if (violationChecked.current) return;

    // Prevent duplicate checks
    violationChecked.current = true;

    const isAuthPage = pathname.includes("/login") || 
                       pathname.includes("/register") || 
                       pathname.includes("/forgot-password") ||
                       pathname.includes("/reset-password");

    // For public layout - check if admin is trying to access
    if (type === "public") {
      // Skip auth pages - they have their own handling
      if (isAuthPage) return;

      // Admin trying to access public pages
      if (isAdmin) {
        setHasViolated(true);
        toast.error("Access Denied", {
          description: "Admin users cannot access the public homepage. Logging out...",
          duration: 3000,
        });
        
        setTimeout(() => {
          logout();
        }, 1000);
      }
    }

    // For admin layout - check if regular user is trying to access
    if (type === "admin") {
      // Allow admin login page
      if (pathname === "/admin/login") return;

      // Regular user trying to access admin pages
      if (!isAdmin) {
        setHasViolated(true);
        toast.error("Access Denied", {
          description: "You need admin privileges to access this page. Logging out...",
          duration: 3000,
        });
        
        setTimeout(() => {
          logout();
        }, 1000);
      }
    }
  }, [pathname, isAdmin, isLoading, user, logout, type]);

  return null;
}
