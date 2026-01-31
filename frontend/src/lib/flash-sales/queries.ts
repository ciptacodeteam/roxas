/**
 * Flash Sales React Query Hooks
 * Queries and mutations for flash sale management
 */

import {
  useQuery,
  useMutation,
  useQueryClient,
  type UseQueryOptions,
  type UseMutationOptions,
} from "@tanstack/react-query";

import {
  getFlashSales,
  getActiveFlashSales,
  getFlashSale,
  createFlashSale,
  updateFlashSale,
  deleteFlashSale,
  getFlashSaleItems,
  getFlashSaleItem,
  createFlashSaleItem,
  updateFlashSaleItem,
  deleteFlashSaleItem,
} from "./api";
import type {
  FlashSale,
  FlashSaleItem,
  CreateFlashSaleRequest,
  UpdateFlashSaleRequest,
  CreateFlashSaleItemRequest,
  UpdateFlashSaleItemRequest,
  FlashSaleListParams,
} from "./types";

/**
 * Query keys for flash sales
 */
export const flashSalesKeys = {
  all: ["flash-sales"] as const,
  lists: () => [...flashSalesKeys.all, "list"] as const,
  list: (params?: FlashSaleListParams) => [...flashSalesKeys.lists(), params] as const,
  active: () => [...flashSalesKeys.all, "active"] as const,
  details: () => [...flashSalesKeys.all, "detail"] as const,
  detail: (id: string) => [...flashSalesKeys.details(), id] as const,
  items: (id: string) => [...flashSalesKeys.detail(id), "items"] as const,
};

/**
 * Query: Get flash sales list (Admin)
 */
export function useFlashSales(
  params?: FlashSaleListParams,
  options?: Omit<
    UseQueryOptions<FlashSale[], Error>,
    "queryKey" | "queryFn"
  >
) {
  return useQuery({
    queryKey: flashSalesKeys.list(params),
    queryFn: () => getFlashSales(params),
    staleTime: 30 * 1000, // 30 seconds
    ...options,
  });
}

/**
 * Query: Get active flash sales (Public)
 */
export function useActiveFlashSales(
  options?: Omit<
    UseQueryOptions<FlashSale[], Error>,
    "queryKey" | "queryFn"
  >
) {
  return useQuery({
    queryKey: flashSalesKeys.active(),
    queryFn: () => getActiveFlashSales(),
    staleTime: 30 * 1000, // 30 seconds
    ...options,
  });
}

/**
 * Query: Get single flash sale
 */
export function useFlashSale(
  id: string,
  options?: Omit<UseQueryOptions<FlashSale, Error>, "queryKey" | "queryFn">
) {
  return useQuery({
    queryKey: flashSalesKeys.detail(id),
    queryFn: () => getFlashSale(id),
    staleTime: 30 * 1000, // 30 seconds
    ...options,
  });
}

/**
 * Query: Get flash sale items
 */
export function useFlashSaleItems(
  flashSaleId: string,
  options?: Omit<UseQueryOptions<FlashSaleItem[], Error>, "queryKey" | "queryFn">
) {
  return useQuery({
    queryKey: flashSalesKeys.items(flashSaleId),
    queryFn: () => getFlashSaleItems(flashSaleId),
    staleTime: 30 * 1000, // 30 seconds
    enabled: !!flashSaleId,
    ...options,
  });
}

/**
 * Query: Get single flash sale item
 */
export function useFlashSaleItem(
  id: string,
  options?: Omit<UseQueryOptions<FlashSaleItem, Error>, "queryKey" | "queryFn">
) {
  return useQuery({
    queryKey: flashSalesKeys.detail(id),
    queryFn: () => getFlashSaleItem(id),
    staleTime: 30 * 1000, // 30 seconds
    enabled: !!id,
    ...options,
  });
}

/**
 * Mutation: Create flash sale
 */
export function useCreateFlashSale(
  options?: UseMutationOptions<FlashSale, Error, CreateFlashSaleRequest>
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createFlashSale,
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({ queryKey: flashSalesKeys.all });
      (options?.onSuccess as any)?.(data, variables, context);
    },
    ...options,
  });
}

/**
 * Mutation: Update flash sale
 */
export function useUpdateFlashSale(
  options?: UseMutationOptions<
    FlashSale,
    Error,
    { id: string; data: UpdateFlashSaleRequest }
  >
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }) => updateFlashSale(id, data),
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({ queryKey: flashSalesKeys.all });
      queryClient.invalidateQueries({
        queryKey: flashSalesKeys.detail(variables.id),
      });
      (options?.onSuccess as any)?.(data, variables, context);
    },
    ...options,
  });
}

/**
 * Mutation: Delete flash sale
 */
export function useDeleteFlashSale(
  options?: UseMutationOptions<void, Error, string>
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteFlashSale,
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({ queryKey: flashSalesKeys.all });
      (options?.onSuccess as any)?.(data, variables, context);
    },
    ...options,
  });
}

/**
 * Mutation: Create flash sale item
 */
export function useCreateFlashSaleItem(
  options?: UseMutationOptions<FlashSaleItem, Error, CreateFlashSaleItemRequest>
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createFlashSaleItem,
    onSuccess: (data, variables, context) => {
      // Invalidate the flash sale detail which contains items
      queryClient.invalidateQueries({ queryKey: flashSalesKeys.detail(variables.flash_sale) });
      // Invalidate flash sale items list
      queryClient.invalidateQueries({ queryKey: flashSalesKeys.items(variables.flash_sale) });
      (options?.onSuccess as any)?.(data, variables, context);
    },
    ...options,
  });
}

/**
 * Mutation: Update flash sale item
 */
export function useUpdateFlashSaleItem(
  flashSaleId?: string,
  options?: UseMutationOptions<
    FlashSaleItem,
    Error,
    { id: string; data: UpdateFlashSaleItemRequest }
  >
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }) => updateFlashSaleItem(id, data),
    onSuccess: (data, variables, context) => {
      if (flashSaleId) {
        queryClient.invalidateQueries({ queryKey: flashSalesKeys.detail(flashSaleId) });
        queryClient.invalidateQueries({ queryKey: flashSalesKeys.items(flashSaleId) });
      }
      queryClient.invalidateQueries({ queryKey: flashSalesKeys.all });
      (options?.onSuccess as any)?.(data, variables, context);
    },
    ...options,
  });
}

/**
 * Mutation: Delete flash sale item
 */
export function useDeleteFlashSaleItem(
  flashSaleId?: string,
  options?: UseMutationOptions<void, Error, string>
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteFlashSaleItem,
    onSuccess: (data, variables, context) => {
      if (flashSaleId) {
        queryClient.invalidateQueries({ queryKey: flashSalesKeys.detail(flashSaleId) });
        queryClient.invalidateQueries({ queryKey: flashSalesKeys.items(flashSaleId) });
      }
      queryClient.invalidateQueries({ queryKey: flashSalesKeys.all });
      (options?.onSuccess as any)?.(data, variables, context);
    },
    ...options,
  });
}
