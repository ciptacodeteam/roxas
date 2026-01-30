import { useQuery, type UseQueryOptions } from "@tanstack/react-query";
import { getUserOrdersApi, type Order, type OrderFilters, type OrderListResponse } from "./api";

// ==================== QUERY KEYS ====================

export const transactionKeys = {
  all: ["transactions"] as const,
  lists: () => [...transactionKeys.all, "list"] as const,
  list: (filters?: OrderFilters) => [...transactionKeys.lists(), filters] as const,
  details: () => [...transactionKeys.all, "detail"] as const,
  detail: (id: string) => [...transactionKeys.details(), id] as const,
};

// ==================== QUERIES ====================

/**
 * Hook to get user's orders/transactions
 */
export function useUserTransactions(
  filters?: OrderFilters,
  options?: Omit<UseQueryOptions<OrderListResponse, Error>, "queryKey" | "queryFn">
) {
  return useQuery<OrderListResponse, Error>({
    queryKey: transactionKeys.list(filters),
    queryFn: () => getUserOrdersApi(filters),
    staleTime: 30 * 1000, // 30 seconds
    ...options,
  });
}
