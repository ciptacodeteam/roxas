/**
 * Authentication React Query Hooks
 * Queries and mutations for auth operations
 */

import {
  useQuery,
  useMutation,
  useQueryClient,
  type UseQueryOptions,
  type UseMutationOptions,
} from "@tanstack/react-query";

import {
  loginApi,
  logoutApi,
  getSessionApi,
  registerApi,
  changePasswordApi,
  refreshTokenApi,
} from "./api";
import type {
  LoginRequest,
  LoginResponse,
  RegisterRequest,
  RegisterResponse,
  SessionResponse,
  ChangePasswordRequest,
} from "./types";

/**
 * Query keys for auth
 */
export const authKeys = {
  all: ["auth"] as const,
  session: () => [...authKeys.all, "session"] as const,
  user: () => [...authKeys.all, "user"] as const,
};

/**
 * Query: Get current session
 */
export function useSessionQuery(
  options?: Omit<UseQueryOptions<SessionResponse, Error>, "queryKey" | "queryFn">
) {
  const queryClient = useQueryClient();

  return useQuery({
    queryKey: authKeys.session(),
    queryFn: getSessionApi,
    retry: (failureCount, error) => {
      // Don't retry on auth errors (401/403)
      if (error instanceof Error && error.message.includes("Session expired")) {
        return false;
      }
      // Retry network errors up to 2 times
      return failureCount < 2;
    },
    retryDelay: 1000, // Wait 1 second before retry
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 5 * 60 * 1000, // Keep in cache for 5 minutes
    refetchOnMount: true, // Always refetch on component mount
    refetchOnWindowFocus: false, // Don't refetch on window focus to avoid flicker
    meta: {
      onError: (error: Error) => {
        // Clear session on auth error
        console.error("[Session] Auth error - clearing session:", error.message);
        queryClient.setQueryData(authKeys.session(), null);
        queryClient.removeQueries({ queryKey: authKeys.all });
      },
    },
    ...options,
  });
}

/**
 * Mutation: Login
 */
export function useLoginMutation(
  options?: UseMutationOptions<LoginResponse, Error, LoginRequest>
) {
  const queryClient = useQueryClient();
  const { onSuccess, ...otherOptions } = options ?? {};

  return useMutation({
    ...otherOptions,
    mutationFn: loginApi,
    onSuccess: (data, variables, context, mutationContext) => {
      // Update session cache
      queryClient.setQueryData(authKeys.session(), { user: data.user });
      // Call user-provided onSuccess if it exists
      if (onSuccess) {
        onSuccess(data, variables, context, mutationContext);
      }
    },
  });
}

/**
 * Mutation: Logout
 */
export function useLogoutMutation(
  options?: UseMutationOptions<void, Error, void>
) {
  const queryClient = useQueryClient();
  const { onSuccess, ...otherOptions } = options ?? {};

  return useMutation({
    ...otherOptions,
    mutationFn: logoutApi,
    onSuccess: (data, variables, context, mutationContext) => {
      // Clear all auth data
      queryClient.setQueryData(authKeys.session(), null);
      queryClient.removeQueries({ queryKey: authKeys.all });
      // Call user-provided onSuccess if it exists
      if (onSuccess) {
        onSuccess(data, variables, context, mutationContext);
      }
    },
  });
}

/**
 * Mutation: Register
 */
export function useRegisterMutation(
  options?: UseMutationOptions<RegisterResponse, Error, RegisterRequest>
) {
  const queryClient = useQueryClient();
  const { onSuccess, ...otherOptions } = options ?? {};

  return useMutation({
    ...otherOptions,
    mutationFn: registerApi,
    onSuccess: (data, variables, context, mutationContext) => {
      // Update session cache
      queryClient.setQueryData(authKeys.session(), { user: data.user });
      // Call user-provided onSuccess if it exists
      if (onSuccess) {
        onSuccess(data, variables, context, mutationContext);
      }
    },
  });
}

/**
 * Mutation: Change password
 */
export function useChangePasswordMutation(
  options?: UseMutationOptions<void, Error, ChangePasswordRequest>
) {
  return useMutation({
    mutationFn: changePasswordApi,
    ...options,
  });
}

/**
 * Query: Automatic token refresh
 * Refreshes the access token every 4 minutes if user is authenticated
 */
export function useTokenRefresh(isAuthenticated: boolean) {
  const queryClient = useQueryClient();

  return useQuery({
    queryKey: [...authKeys.all, "refresh"] as const,
    queryFn: async () => {
      try {
        await refreshTokenApi();
        return { success: true, timestamp: new Date().toISOString() };
      } catch (error) {
        // Clear session on refresh failure
        queryClient.setQueryData(authKeys.session(), null);
        throw error;
      }
    },
    enabled: isAuthenticated, // Only refresh if user is logged in
    refetchInterval: 4 * 60 * 1000, // Refresh every 4 minutes
    refetchIntervalInBackground: true, // Continue refreshing even when tab is not active
    retry: 3, // Retry 3 times before giving up
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000), // Exponential backoff: 1s, 2s, 4s
    staleTime: Infinity, // This query never goes stale
    meta: {
      onError: () => {
        // Force logout on persistent refresh failure
        console.error("[Token Refresh] Persistent refresh failure - logging out");
        queryClient.setQueryData(authKeys.session(), null);
        queryClient.removeQueries({ queryKey: authKeys.all });
      },
    },
  });
}
