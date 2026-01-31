/**
 * Authentication Custom Hooks
 * High-level hooks for common auth operations
 */

"use client";

import { useCallback } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  useLoginMutation,
  useLogoutMutation,
  useRegisterMutation,
  useChangePasswordMutation,
} from "./queries";
import { useAuthContext } from "./provider";
import type { LoginRequest, RegisterRequest, ChangePasswordRequest } from "./types";

/**
 * Hook for authentication state and utilities
 */
export function useAuth() {
  const context = useAuthContext();
  return context;
}

/**
 * Hook for login with automatic redirect and toast
 */
export function useLogin(options?: {
  onSuccess?: () => void;
  onError?: (error: Error) => void;
  redirectTo?: string;
  isAdmin?: boolean;
}) {
  const router = useRouter();
  const { refetchSession } = useAuthContext();
  const logoutMutation = useLogoutMutation();

  const mutation = useLoginMutation({
    onSuccess: (data) => {
      const isStaffUser = data.user.role === "STAFF";

      // Admin login - only STAFF users allowed
      if (options?.isAdmin) {
        if (!isStaffUser) {
          toast.error("Access Denied", {
            description: "Only admin accounts can access this page.",
          });
          // Force logout the non-admin user
          logoutMutation.mutate();
          return;
        }

        toast.success("Login Successful", {
          description: "Redirecting to admin dashboard...",
        });

        refetchSession();

        setTimeout(() => {
          window.location.href = options?.redirectTo || "/admin";
        }, 500);

        options?.onSuccess?.();
        return;
      }

      // Public login - STAFF users NOT allowed
      if (isStaffUser) {
        toast.error("Access Denied", {
          description: "Staff accounts must use the admin login page.",
        });
        // Force logout the staff user
        logoutMutation.mutate();
        return;
      }

      // Regular user login successful
      toast.success("Login Successful", {
        description: "Welcome back!",
      });

      refetchSession();

      const destination = options?.redirectTo || "/id/profile";

      setTimeout(() => {
        window.location.href = destination;
      }, 500);

      options?.onSuccess?.();
    },
    onError: (error) => {
      toast.error("Login Failed", {
        description: error.message || "Invalid email or password.",
      });
      options?.onError?.(error);
    },
  });

  const login = useCallback(
    (data: LoginRequest) => {
      return mutation.mutate(data);
    },
    [mutation]
  );

  return {
    login,
    isLoading: mutation.isPending,
    error: mutation.error,
  };
}

/**
 * Hook for logout with automatic redirect
 */
export function useLogout(options?: {
  onSuccess?: () => void;
  redirectTo?: string;
}) {
  const mutation = useLogoutMutation({
    onSuccess: () => {
      toast.success("Logout Berhasil", {
        description: "Anda telah berhasil logout. Sampai jumpa!",
      });

      const destination = options?.redirectTo || "/id";

      setTimeout(() => {
        window.location.href = destination;
      }, 500);

      options?.onSuccess?.();
    },
    onError: (error) => {
      toast.error("Logout Gagal", {
        description: error.message || "Terjadi kesalahan saat logout.",
      });
    },
  });

  const logout = useCallback(() => {
    return mutation.mutate();
  }, [mutation]);

  return {
    logout,
    isLoading: mutation.isPending,
  };
}

/**
 * Hook for registration with automatic redirect and role-based access control
 */
export function useRegister(options?: {
  onSuccess?: () => void;
  onError?: (error: Error) => void;
  redirectTo?: string;
  isAdmin?: boolean;
}) {
  const { refetchSession } = useAuthContext();
  const logoutMutation = useLogoutMutation();

  const mutation = useRegisterMutation({
    onSuccess: (data) => {
      const isStaffUser = data.user.role === "STAFF";

      // Admin registration - only STAFF users allowed
      if (options?.isAdmin) {
        if (!isStaffUser) {
          toast.error("Access Denied", {
            description: "Only admin accounts can be created here.",
          });
          logoutMutation.mutate();
          return;
        }

        toast.success("Registration Successful", {
          description: "Admin account created. Redirecting...",
        });

        refetchSession();

        setTimeout(() => {
          window.location.href = options?.redirectTo || "/admin";
        }, 500);

        options?.onSuccess?.();
        return;
      }

      // Public registration - STAFF users NOT allowed
      if (isStaffUser) {
        toast.error("Access Denied", {
          description: "Staff accounts cannot be created through public registration.",
        });
        logoutMutation.mutate();
        return;
      }

      // Regular user registration successful
      toast.success("Registration Successful", {
        description: "Your account has been created successfully!",
      });

      refetchSession();

      const destination = options?.redirectTo || "/id/profile";

      setTimeout(() => {
        window.location.href = destination;
      }, 500);

      options?.onSuccess?.();
    },
    onError: (error) => {
      toast.error("Registration Failed", {
        description: error.message || "An error occurred during registration.",
      });
      options?.onError?.(error);
    },
  });

  const register = useCallback(
    (data: RegisterRequest) => {
      return mutation.mutate(data);
    },
    [mutation]
  );

  return {
    register,
    isPending: mutation.isPending,
    error: mutation.error,
  };
}

/**
 * Hook for changing password
 */
export function useChangePassword(options?: {
  onSuccess?: () => void;
  onError?: (error: Error) => void;
}) {
  const mutation = useChangePasswordMutation({
    onSuccess: () => {
      toast.success("Password Changed", {
        description: "Your password has been updated successfully.",
      });
      options?.onSuccess?.();
    },
    onError: (error) => {
      toast.error("Password Change Failed", {
        description: error.message || "An error occurred.",
      });
      options?.onError?.(error);
    },
  });

  const changePassword = useCallback(
    (data: ChangePasswordRequest) => {
      return mutation.mutate(data);
    },
    [mutation]
  );

  return {
    changePassword,
    isLoading: mutation.isPending,
    error: mutation.error,
  };
}

/**
 * Hook to require authentication (redirect if not authenticated)
 */
export function useRequireAuth(redirectTo = "/id/login") {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  if (!isLoading && !isAuthenticated) {
    router.push(redirectTo);
  }

  return { isAuthenticated, isLoading };
}

/**
 * Hook to require admin role (redirect if not admin)
 */
export function useRequireAdmin(redirectTo = "/admin/login") {
  const { isAdmin, isLoading } = useAuth();
  const router = useRouter();

  if (!isLoading && !isAdmin) {
    router.push(redirectTo);
  }

  return { isAdmin, isLoading };
}
