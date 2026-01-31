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
  const { data, isLoading, refetch, error } = useSessionQuery();
  
  const user = data?.user ?? null;
  const isAuthenticated = !!user;
  
  // Automatically refresh token every 4 minutes if authenticated
  useTokenRefresh(isAuthenticated);

  const value = useMemo<AuthContextValue>(() => {
    const isAdmin = user
      ? user.role === "STAFF"
      : false;

    return {
      user,
      session: data, // Include session object with user property
      isAuthenticated,
      isLoading,
      isAdmin,
      refetchSession: refetch,
    };
  }, [data, isLoading, refetch, user, isAuthenticated]);

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
