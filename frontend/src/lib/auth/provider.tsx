/**
 * Authentication Context Provider
 * Manages global auth state and provides auth utilities
 */

"use client";

import React, { createContext, useContext, useMemo } from "react";
import { useSessionQuery, useTokenRefresh } from "./queries";
import type { AuthState, User } from "./types";

interface AuthContextValue extends AuthState {
  session: { user: User } | undefined;
  refetchSession: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

/**
 * Auth Provider Component
 */
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { data, isLoading, isPending, isFetching, refetch, error } = useSessionQuery();
  
  const user = data?.user ?? null;
  const isAuthenticated = !!user;
  
  // Consider loading if either isPending (no data yet) or currently fetching
  // This prevents flash of unauthenticated state during navigation
  const isAuthLoading = isPending || (isLoading && isFetching);
  
  // Automatically refresh token every 4 minutes if authenticated
  const { error: refreshError } = useTokenRefresh(isAuthenticated);

  // Monitor refresh errors
  React.useEffect(() => {
    if (refreshError) {
      console.error("[Auth Provider] Token refresh failed:", refreshError);
      // Session will be automatically cleared by the query's onError handler
    }
  }, [refreshError]);

  const value = useMemo<AuthContextValue>(() => {
    const isAdmin = user
      ? user.role === "STAFF"
      : false;

    return {
      user,
      session: data, // Include session object with user property
      isAuthenticated,
      isLoading: isAuthLoading, // Use combined loading state
      isAdmin,
      refetchSession: refetch,
    };
  }, [data, isAuthLoading, refetch, user, isAuthenticated]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

/**
 * Hook to access auth context
 */
export function useAuthContext(): AuthContextValue {
  const context = useContext(AuthContext);

  if (context === undefined) {
    throw new Error("useAuthContext must be used within AuthProvider");
  }

  return context;
}
