import {
    useQuery,
    useMutation,
    useQueryClient,
    type UseQueryOptions,
    type UseMutationOptions,
} from "@tanstack/react-query";
import {
    getProducts,
    getActiveProducts,
    getActiveProductBySlug,
    getProduct,
    createProduct,
    updateProduct,
    deleteProduct,
    ProductsApiError,
} from "./api";
import type {
    Product,
    ProductWithItems,
    CreateProductRequest,
    UpdateProductRequest,
} from "./types";

// Query keys factory
export const productsQueryKeys = {
    all: ["products"] as const,
    lists: () => [...productsQueryKeys.all, "list"] as const,
    list: (params?: { category?: string; search?: string }) => [...productsQueryKeys.lists(), params] as const,
    active: (params?: { category?: string; search?: string }) => [...productsQueryKeys.all, "active", params] as const,
    details: () => [...productsQueryKeys.all, "detail"] as const,
    detail: (id: string) => [...productsQueryKeys.details(), id] as const,
    detailBySlug: (slug: string) => [...productsQueryKeys.all, "slug", slug] as const,
};

// Queries
export function useProducts(
    options?: Omit<UseQueryOptions<Product[], ProductsApiError>, "queryKey" | "queryFn">
) {
    return useQuery({
        queryKey: productsQueryKeys.list(),
        queryFn: getProducts,
        ...options,
    });
}

/**
 * Get active products (Public)
 */
export function useActiveProducts(
    params?: { category?: string; search?: string },
    options?: Omit<UseQueryOptions<Product[], ProductsApiError>, "queryKey" | "queryFn">
) {
    return useQuery({
        queryKey: productsQueryKeys.active(params),
        queryFn: () => getActiveProducts(params),
        ...options,
    });
}

export function useProduct(
    id: string,
    options?: Omit<UseQueryOptions<ProductWithItems, ProductsApiError>, "queryKey" | "queryFn">
) {
    return useQuery({
        queryKey: productsQueryKeys.detail(id),
        queryFn: () => getProduct(id),
        enabled: !!id,
        ...options,
    });
}

/**
 * Get active product by slug (Public)
 */
export function useActiveProductBySlug(
    slug: string,
    options?: Omit<UseQueryOptions<ProductWithItems, ProductsApiError>, "queryKey" | "queryFn">
) {
    return useQuery({
        queryKey: productsQueryKeys.detailBySlug(slug),
        queryFn: () => getActiveProductBySlug(slug),
        enabled: !!slug,
        ...options,
    });
}

// Mutations
export function useCreateProduct(
    options?: Omit<
        UseMutationOptions<Product, ProductsApiError, CreateProductRequest>,
        "mutationFn"
    >
) {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: createProduct,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: productsQueryKeys.lists() });
        },
        ...options,
    });
}

export function useUpdateProduct(
    options?: Omit<
        UseMutationOptions<Product, ProductsApiError, { id: string; data: UpdateProductRequest }>,
        "mutationFn"
    >
) {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, data }) => updateProduct(id, data),
        onSuccess: (_, { id }) => {
            queryClient.invalidateQueries({ queryKey: productsQueryKeys.lists() });
            queryClient.invalidateQueries({ queryKey: productsQueryKeys.detail(id) });
        },
        ...options,
    });
}

export function useDeleteProduct(
    options?: Omit<UseMutationOptions<void, ProductsApiError, string>, "mutationFn">
) {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: deleteProduct,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: productsQueryKeys.lists() });
        },
        ...options,
    });
}

/**
 * Search products with debouncing for navbar
 */
export function useProductSearch(
    searchQuery: string,
    options?: Omit<UseQueryOptions<Product[], ProductsApiError>, "queryKey" | "queryFn">
) {
    return useQuery({
        queryKey: productsQueryKeys.active({ search: searchQuery }),
        queryFn: () => getActiveProducts({ search: searchQuery }),
        enabled: searchQuery.length > 0,
        staleTime: 30000, // 30 seconds
        ...options,
    });
}
