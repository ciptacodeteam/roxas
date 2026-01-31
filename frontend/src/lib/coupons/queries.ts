/**
 * Coupons React Query Hooks
 * Queries and mutations for coupon management
 */

import {
  useQuery,
  useMutation,
  useQueryClient,
  type UseQueryOptions,
  type UseMutationOptions,
} from "@tanstack/react-query";

import {
  getCoupons,
  getCoupon,
  createCoupon,
  updateCoupon,
  deleteCoupon,
} from "./api";
import type {
  Coupon,
  CreateCouponRequest,
  UpdateCouponRequest,
  CouponListParams,
} from "./types";

/**
 * Query keys for coupons
 */
export const couponsKeys = {
  all: ["coupons"] as const,
  lists: () => [...couponsKeys.all, "list"] as const,
  list: (params?: CouponListParams) => [...couponsKeys.lists(), params] as const,
  details: () => [...couponsKeys.all, "detail"] as const,
  detail: (id: string) => [...couponsKeys.details(), id] as const,
};

/**
 * Query: Get coupons list
 */
export function useCoupons(
  params?: CouponListParams,
  options?: Omit<
    UseQueryOptions<Coupon[], Error>,
    "queryKey" | "queryFn"
  >
) {
  return useQuery({
    queryKey: couponsKeys.list(params),
    queryFn: () => getCoupons(params),
    staleTime: 30 * 1000, // 30 seconds
    ...options,
  });
}

/**
 * Query: Get single coupon
 */
export function useCoupon(
  id: string,
  options?: Omit<UseQueryOptions<Coupon, Error>, "queryKey" | "queryFn">
) {
  return useQuery({
    queryKey: couponsKeys.detail(id),
    queryFn: () => getCoupon(id),
    staleTime: 30 * 1000, // 30 seconds
    ...options,
  });
}

/**
 * Mutation: Create coupon
 */
export function useCreateCoupon(
  options?: UseMutationOptions<Coupon, Error, CreateCouponRequest>
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createCoupon,
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({ queryKey: couponsKeys.all });
      (options?.onSuccess as any)?.(data, variables, context);
    },
    ...options,
  });
}

/**
 * Mutation: Update coupon
 */
export function useUpdateCoupon(
  options?: UseMutationOptions<
    Coupon,
    Error,
    { id: string; data: UpdateCouponRequest }
  >
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }) => updateCoupon(id, data),
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({ queryKey: couponsKeys.all });
      queryClient.invalidateQueries({
        queryKey: couponsKeys.detail(variables.id),
      });
      (options?.onSuccess as any)?.(data, variables, context);
    },
    ...options,
  });
}

/**
 * Mutation: Delete coupon
 */
export function useDeleteCoupon(
  options?: UseMutationOptions<void, Error, string>
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteCoupon,
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({ queryKey: couponsKeys.all });
      (options?.onSuccess as any)?.(data, variables, context);
    },
    ...options,
  });
}
