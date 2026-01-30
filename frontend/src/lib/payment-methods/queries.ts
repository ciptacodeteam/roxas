/**
 * Payment Methods React Query Hooks
 * Queries and mutations for payment method management
 */

import {
  useQuery,
  useMutation,
  useQueryClient,
  type UseQueryOptions,
  type UseMutationOptions,
} from "@tanstack/react-query";

import {
  getPaymentMethods,
  getPaymentMethod,
  createPaymentMethod,
  updatePaymentMethod,
  deletePaymentMethod,
  getActivePaymentMethods,
} from "./api";
import type {
  PaymentMethod,
  CreatePaymentMethodRequest,
  UpdatePaymentMethodRequest,
  PaymentMethodListParams,
} from "./types";

/**
 * Query keys for payment methods
 */
export const paymentMethodsKeys = {
  all: ["payment-methods"] as const,
  lists: () => [...paymentMethodsKeys.all, "list"] as const,
  list: (params?: PaymentMethodListParams) => [...paymentMethodsKeys.lists(), params] as const,
  details: () => [...paymentMethodsKeys.all, "detail"] as const,
  detail: (id: string) => [...paymentMethodsKeys.details(), id] as const,
};

/**
 * Query: Get payment methods list
 */
export function usePaymentMethods(
  params?: PaymentMethodListParams,
  options?: Omit<
    UseQueryOptions<PaymentMethod[], Error>,
    "queryKey" | "queryFn"
  >
) {
  return useQuery({
    queryKey: paymentMethodsKeys.list(params),
    queryFn: () => getPaymentMethods(params),
    staleTime: 30 * 1000, // 30 seconds
    ...options,
  });
}

/**
 * Query: Get single payment method
 */
export function usePaymentMethod(
  id: string,
  options?: Omit<UseQueryOptions<PaymentMethod, Error>, "queryKey" | "queryFn">
) {
  return useQuery({
    queryKey: paymentMethodsKeys.detail(id),
    queryFn: () => getPaymentMethod(id),
    staleTime: 30 * 1000, // 30 seconds
    ...options,
  });
}

/**
 * Mutation: Create payment method
 */
export function useCreatePaymentMethod(
  options?: UseMutationOptions<PaymentMethod, Error, CreatePaymentMethodRequest>
) {
  const queryClient = useQueryClient();

  const { onSuccess, ...otherOptions } = options || {};

  return useMutation<PaymentMethod, Error, CreatePaymentMethodRequest, unknown>({
    mutationFn: createPaymentMethod,
    onSuccess: (data, variables, context, meta) => {
      // Invalidate all payment method lists
      queryClient.invalidateQueries({ queryKey: paymentMethodsKeys.lists() });
      
      // Call the original onSuccess if provided
      onSuccess?.(data, variables, context, meta);
    },
    ...otherOptions,
  });
}

/**
 * Mutation: Update payment method
 */
export function useUpdatePaymentMethod(
  options?: UseMutationOptions<
    PaymentMethod,
    Error,
    { id: string; data: UpdatePaymentMethodRequest }
  >
) {
  const queryClient = useQueryClient();

  const { onSuccess, ...otherOptions } = options || {};

  return useMutation<PaymentMethod, Error, { id: string; data: UpdatePaymentMethodRequest }, unknown>({
    mutationFn: ({ id, data }) => updatePaymentMethod(id, data),
    onSuccess: (data, variables, context, meta) => {
      // Invalidate all payment method lists
      queryClient.invalidateQueries({ queryKey: paymentMethodsKeys.lists() });
      
      // Invalidate the specific payment method detail
      queryClient.invalidateQueries({
        queryKey: paymentMethodsKeys.detail(variables.id),
      });
      
      // Call the original onSuccess if provided
      onSuccess?.(data, variables, context, meta);
    },
    ...otherOptions,
  });
}

/**
 * Mutation: Delete payment method
 */
export function useDeletePaymentMethod(
  options?: UseMutationOptions<void, Error, string>
) {
  const queryClient = useQueryClient();

  const { onSuccess, ...otherOptions } = options || {};

  return useMutation<void, Error, string, unknown>({
    mutationFn: deletePaymentMethod,
    onSuccess: (data, variables, context, meta) => {
      // Invalidate all payment method lists
      queryClient.invalidateQueries({ queryKey: paymentMethodsKeys.lists() });
      
      // Remove the specific payment method from cache
      queryClient.removeQueries({
        queryKey: paymentMethodsKeys.detail(variables),
      });
      
      // Call the original onSuccess if provided
      onSuccess?.(data, variables, context, meta);
    },
    ...otherOptions,
  });
}

/**
 * Query: Get active payment methods (Public)
 */
export function useActivePaymentMethods(
  options?: Omit<
    UseQueryOptions<PaymentMethod[], Error>,
    "queryKey" | "queryFn"
  >
) {
  return useQuery({
    queryKey: [...paymentMethodsKeys.all, "active"] as const,
    queryFn: () => getActivePaymentMethods(),
    staleTime: 5 * 60 * 1000, // 5 minutes
    ...options,
  });
}
