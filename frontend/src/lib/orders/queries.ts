import {
    useQuery,
    type UseQueryOptions,
} from "@tanstack/react-query";
import { getOrders, getOrder } from "./api";
import type { Order } from "./types";

// Query keys factory
export const ordersQueryKeys = {
    all: ["orders"] as const,
    lists: () => [...ordersQueryKeys.all, "list"] as const,
    list: (filters?: { status?: string }) => [...ordersQueryKeys.lists(), filters] as const,
    details: () => [...ordersQueryKeys.all, "detail"] as const,
    detail: (id: string) => [...ordersQueryKeys.details(), id] as const,
};

// Queries
export function useOrders(
    filters?: { status?: string },
    options?: Omit<UseQueryOptions<Order[], Error>, "queryKey" | "queryFn">
) {
    return useQuery({
        queryKey: ordersQueryKeys.list(filters),
        queryFn: () => getOrders(filters),
        ...options,
    });
}

export function useOrder(
    id: string,
    options?: Omit<UseQueryOptions<Order, Error>, "queryKey" | "queryFn">
) {
    return useQuery({
        queryKey: ordersQueryKeys.detail(id),
        queryFn: () => getOrder(id),
        enabled: !!id,
        ...options,
    });
}
