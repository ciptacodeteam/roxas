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
  return useQuery({
    queryKey: authKeys.session(),
    queryFn: getSessionApi,
    retry: false,
    staleTime: 5 * 60 * 1000, // 5 minutes
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

  const userOnSuccess = options?.onSuccess;
  
  return useMutation({
    ...options,
    mutationFn: loginApi,
    onSuccess: (data, variables, context) => {
      // Update session cache
      queryClient.setQueryData(authKeys.session(), { user: data.user });
      // Call user-provided onSuccess if it exists
      (userOnSuccess as any)?.(data, variables, context);
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

  const userOnSuccess = options?.onSuccess;
  
  return useMutation({
    ...options,
    mutationFn: logoutApi,
    onSuccess: (data, variables, context) => {
      // Clear all auth data
      queryClient.setQueryData(authKeys.session(), null);
      queryClient.removeQueries({ queryKey: authKeys.all });
      // Call user-provided onSuccess if it exists
      (userOnSuccess as any)?.(data, variables, context);
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

  const userOnSuccess = options?.onSuccess;
  
  return useMutation({
    ...options,
    mutationFn: registerApi,
    onSuccess: (data, variables, context) => {
      // Update session cache
      queryClient.setQueryData(authKeys.session(), { user: data.user });
      // Call user-provided onSuccess if it exists
      (userOnSuccess as any)?.(data, variables, context);
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
  return useQuery({
    queryKey: [...authKeys.all, "refresh"] as const,
    queryFn: async () => {
      console.log("[Token Refresh] Refreshing access token...");
      await refreshTokenApi();
      console.log("[Token Refresh] Access token refreshed successfully");
      return { success: true, timestamp: new Date().toISOString() };
    },
    enabled: isAuthenticated, // Only refresh if user is logged in
    refetchInterval: 4 * 60 * 1000, // Refresh every 4 minutes
    refetchIntervalInBackground: true, // Continue refreshing even when tab is not active
    retry: false, // Don't retry if refresh fails
    staleTime: Infinity, // This query never goes stale
  });
}
