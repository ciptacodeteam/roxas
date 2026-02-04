import {
    useQuery,
    useMutation,
    useQueryClient,
    type UseQueryOptions,
    type UseMutationOptions,
} from "@tanstack/react-query";
import {
    getProductItems,
    getProductItem,
    createProductItem,
    updateProductItem,
    deleteProductItem,
    syncPrices,
    getSyncStatus,
    searchProductItems,
    ProductItemsApiError,
} from "./api";
import type {
    ProductItem,
    ProductItemWithProduct,
    CreateProductItemRequest,
    UpdateProductItemRequest,
    SyncPricesRequest,
    SyncPricesResponse,
    SyncStatus,
} from "./types";

// Query keys factory
export const productItemsQueryKeys = {
    all: ["product-items"] as const,
    lists: () => [...productItemsQueryKeys.all, "list"] as const,
    list: () => [...productItemsQueryKeys.lists()] as const,
    details: () => [...productItemsQueryKeys.all, "detail"] as const,
    detail: (id: string) => [...productItemsQueryKeys.details(), id] as const,
    syncStatus: () => [...productItemsQueryKeys.all, "sync-status"] as const,
    search: (query: string) => [...productItemsQueryKeys.all, "search", query] as const,
};

// Queries
export function useProductItems(
    options?: Omit<UseQueryOptions<ProductItem[], ProductItemsApiError>, "queryKey" | "queryFn">
) {
    return useQuery({
        queryKey: productItemsQueryKeys.list(),
        queryFn: getProductItems,
        ...options,
    });
}

/**
 * Search product items with server-side filtering
 * Only triggers when query is at least 2 characters
 */
export function useSearchProductItems(
    query: string,
    options?: Omit<UseQueryOptions<ProductItem[], ProductItemsApiError>, "queryKey" | "queryFn">
) {
    return useQuery({
        queryKey: productItemsQueryKeys.search(query),
        queryFn: () => searchProductItems(query),
        enabled: query.length >= 2,
        staleTime: 30000, // Cache search results for 30 seconds
        ...options,
    });
}

export function useProductItem(
    id: string,
    options?: Omit<UseQueryOptions<ProductItemWithProduct, ProductItemsApiError>, "queryKey" | "queryFn">
) {
    return useQuery({
        queryKey: productItemsQueryKeys.detail(id),
        queryFn: () => getProductItem(id),
        enabled: !!id,
        ...options,
    });
}

export function useSyncStatus(
    options?: Omit<UseQueryOptions<SyncStatus, ProductItemsApiError>, "queryKey" | "queryFn">
) {
    return useQuery({
        queryKey: productItemsQueryKeys.syncStatus(),
        queryFn: getSyncStatus,
        refetchInterval: (query) => {
            // Auto-refetch every 2 seconds if syncing
            return query.state.data?.is_syncing ? 2000 : false;
        },
        ...options,
    });
}

// Mutations
export function useCreateProductItem(
    options?: Omit<
        UseMutationOptions<ProductItem, ProductItemsApiError, CreateProductItemRequest>,
        "mutationFn"
    >
) {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: createProductItem,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: productItemsQueryKeys.lists() });
        },
        ...options,
    });
}

export function useUpdateProductItem(
    options?: Omit<
        UseMutationOptions<ProductItem, ProductItemsApiError, { id: string; data: UpdateProductItemRequest }>,
        "mutationFn"
    >
) {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, data }) => updateProductItem(id, data),
        onSuccess: (_, { id }) => {
            queryClient.invalidateQueries({ queryKey: productItemsQueryKeys.lists() });
            queryClient.invalidateQueries({ queryKey: productItemsQueryKeys.detail(id) });
        },
        ...options,
    });
}

export function useDeleteProductItem(
    options?: Omit<UseMutationOptions<void, ProductItemsApiError, string, { previousItems: ProductItem[] | undefined }>, "mutationFn">
) {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: deleteProductItem,
        onMutate: async (deletedId) => {
            // Cancel any outgoing refetches
            await queryClient.cancelQueries({ queryKey: productItemsQueryKeys.lists() });

            // Snapshot the previous value
            const previousItems = queryClient.getQueryData<ProductItem[]>(productItemsQueryKeys.list());

            // Optimistically update to the new value
            if (previousItems) {
                queryClient.setQueryData<ProductItem[]>(
                    productItemsQueryKeys.list(),
                    previousItems.filter((item) => item.id !== deletedId)
                );
            }

            // Return a context object with the snapshotted value
            return { previousItems };
        },
        onError: (err, deletedId, context: any) => {
            // If the mutation fails, use the context returned from onMutate to roll back
            if (context?.previousItems) {
                queryClient.setQueryData(productItemsQueryKeys.list(), context.previousItems);
            }
        },
        onSettled: () => {
            // Always refetch after error or success
            queryClient.invalidateQueries({ queryKey: productItemsQueryKeys.lists() });
        },
        ...options,
    });
}

export function useSyncPrices(
    options?: Omit<UseMutationOptions<SyncPricesResponse, ProductItemsApiError, SyncPricesRequest | undefined>, "mutationFn">
) {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (data) => syncPrices(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: productItemsQueryKeys.lists() });
            queryClient.invalidateQueries({ queryKey: productItemsQueryKeys.syncStatus() });
        },
        ...options,
    });
}
