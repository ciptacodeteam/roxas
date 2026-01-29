/**
 * Users React Query Hooks
 * Queries and mutations for user management
 */

import {
  useQuery,
  useMutation,
  useQueryClient,
  type UseQueryOptions,
  type UseMutationOptions,
} from "@tanstack/react-query";

import {
  getStaffUsers,
  getCustomerUsers,
  getStaffUser,
  getCustomerUser,
  createStaffUser,
  createCustomerUser,
  updateStaffUser,
  updateCustomerUser,
  toggleUserActive,
  sendEmailVerification,
  sendPasswordReset,
} from "./api";
import type {
  StaffUser,
  CustomerUser,
  CreateUserRequest,
  UpdateUserRequest,
  UserListParams,
  PaginatedResponse,
} from "./types";

/**
 * Query keys for users
 */
export const usersKeys = {
  all: ["users"] as const,
  staff: () => [...usersKeys.all, "staff"] as const,
  staffList: (params?: UserListParams) => [...usersKeys.staff(), "list", params] as const,
  staffDetail: (id: number) => [...usersKeys.staff(), "detail", id] as const,
  customer: () => [...usersKeys.all, "customer"] as const,
  customerList: (params?: UserListParams) => [...usersKeys.customer(), "list", params] as const,
  customerDetail: (id: number) => [...usersKeys.customer(), "detail", id] as const,
};

/**
 * Query: Get staff users list
 */
export function useStaffUsers(
  params?: UserListParams,
  options?: Omit<
    UseQueryOptions<PaginatedResponse<StaffUser>, Error>,
    "queryKey" | "queryFn"
  >
) {
  return useQuery({
    queryKey: usersKeys.staffList(params),
    queryFn: () => getStaffUsers(params),
    staleTime: 30 * 1000, // 30 seconds
    ...options,
  });
}

/**
 * Query: Get customer users list
 */
export function useCustomerUsers(
  params?: UserListParams,
  options?: Omit<
    UseQueryOptions<PaginatedResponse<CustomerUser>, Error>,
    "queryKey" | "queryFn"
  >
) {
  return useQuery({
    queryKey: usersKeys.customerList(params),
    queryFn: () => getCustomerUsers(params),
    staleTime: 30 * 1000, // 30 seconds
    ...options,
  });
}

/**
 * Query: Get all users (staff + customer)
 */
export function useAllUsers(
  params?: UserListParams,
  options?: { enabled?: boolean }
) {
  const staffQuery = useStaffUsers(params, options);
  const customerQuery = useCustomerUsers(params, options);

  return {
    data: {
      staff: staffQuery.data?.results || [],
      customers: customerQuery.data?.results || [],
      total: (staffQuery.data?.count || 0) + (customerQuery.data?.count || 0),
    },
    isLoading: staffQuery.isLoading || customerQuery.isLoading,
    error: staffQuery.error || customerQuery.error,
  };
}

/**
 * Query: Get single staff user
 */
export function useStaffUser(
  id: number,
  options?: Omit<UseQueryOptions<StaffUser, Error>, "queryKey" | "queryFn">
) {
  return useQuery({
    queryKey: usersKeys.staffDetail(id),
    queryFn: () => getStaffUser(id),
    enabled: !!id,
    staleTime: 30 * 1000,
    ...options,
  });
}

/**
 * Query: Get single customer user
 */
export function useCustomerUser(
  id: number,
  options?: Omit<UseQueryOptions<CustomerUser, Error>, "queryKey" | "queryFn">
) {
  return useQuery({
    queryKey: usersKeys.customerDetail(id),
    queryFn: () => getCustomerUser(id),
    enabled: !!id,
    staleTime: 30 * 1000,
    ...options,
  });
}

/**
 * Mutation: Create staff user
 */
export function useCreateStaffUser(
  options?: UseMutationOptions<StaffUser, Error, CreateUserRequest>
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createStaffUser,
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({ queryKey: usersKeys.staff() });
      queryClient.invalidateQueries({ queryKey: usersKeys.all });
      options?.onSuccess?.(data, variables, context);
    },
    ...options,
  });
}

/**
 * Mutation: Create customer user
 */
export function useCreateCustomerUser(
  options?: UseMutationOptions<CustomerUser, Error, CreateUserRequest>
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createCustomerUser,
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({ queryKey: usersKeys.customer() });
      queryClient.invalidateQueries({ queryKey: usersKeys.all });
      options?.onSuccess?.(data, variables, context);
    },
    ...options,
  });
}

/**
 * Mutation: Update staff user
 */
export function useUpdateStaffUser(
  options?: UseMutationOptions<
    StaffUser,
    Error,
    { id: number; data: UpdateUserRequest }
  >
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }) => updateStaffUser(id, data),
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({ queryKey: usersKeys.staff() });
      queryClient.invalidateQueries({ queryKey: usersKeys.all });
      queryClient.invalidateQueries({
        queryKey: usersKeys.staffDetail(variables.id),
      });
      options?.onSuccess?.(data, variables, context);
    },
    ...options,
  });
}

/**
 * Mutation: Update customer user
 */
export function useUpdateCustomerUser(
  options?: UseMutationOptions<
    CustomerUser,
    Error,
    { id: number; data: UpdateUserRequest }
  >
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }) => updateCustomerUser(id, data),
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({ queryKey: usersKeys.customer() });
      queryClient.invalidateQueries({ queryKey: usersKeys.all });
      queryClient.invalidateQueries({
        queryKey: usersKeys.customerDetail(variables.id),
      });
      options?.onSuccess?.(data, variables, context);
    },
    ...options,
  });
}

/**
 * Mutation: Toggle user active status
 */
export function useToggleUserActive(
  options?: UseMutationOptions<
    void,
    Error,
    { profileType: "staff" | "customers"; profileId: number; activate: boolean }
  >
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ profileType, profileId, activate }) =>
      toggleUserActive(profileType, profileId, activate),
    onSuccess: (data, variables, context) => {
      // Invalidate both staff and customer queries
      queryClient.invalidateQueries({ queryKey: usersKeys.all });
      options?.onSuccess?.(data, variables, context);
    },
    ...options,
  });
}

/**
 * Mutation: Send email verification
 */
export function useSendEmailVerification(
  options?: UseMutationOptions<void, Error, number>
) {
  return useMutation({
    mutationFn: (userId: number) => sendEmailVerification(userId),
    ...options,
  });
}

/**
 * Mutation: Send password reset
 */
export function useSendPasswordReset(
  options?: UseMutationOptions<void, Error, number>
) {
  return useMutation({
    mutationFn: (userId: number) => sendPasswordReset(userId),
    ...options,
  });
}
