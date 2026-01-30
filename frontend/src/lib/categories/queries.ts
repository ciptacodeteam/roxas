import { useQuery, useMutation, useQueryClient, type UseQueryOptions, type UseMutationOptions } from "@tanstack/react-query";
import {
    getCategories,
    getActiveCategories,
    getCategory,
    createCategory,
    updateCategory,
    deleteCategory,
    CategoriesApiError
} from "./api";
import type { Category, CategoryWithCount, CreateCategoryRequest, UpdateCategoryRequest } from "./types";

/**
 * Query keys factory for categories
 */
export const categoriesQueryKeys = {
    all: ["categories"] as const,
    lists: () => [...categoriesQueryKeys.all, "list"] as const,
    list: () => [...categoriesQueryKeys.lists()] as const,
    active: () => [...categoriesQueryKeys.all, "active"] as const,
    details: () => [...categoriesQueryKeys.all, "detail"] as const,
    detail: (id: string) => [...categoriesQueryKeys.details(), id] as const,
};

/**
 * Get all categories (Admin)
 */
export function useCategories(
    options?: Omit<UseQueryOptions<Category[], CategoriesApiError>, "queryKey" | "queryFn">
) {
    return useQuery({
        queryKey: categoriesQueryKeys.list(),
        queryFn: () => getCategories(),
        ...options,
    });
}

/**
 * Get active categories (Public)
 */
export function useActiveCategories(
    options?: Omit<UseQueryOptions<Category[], CategoriesApiError>, "queryKey" | "queryFn">
) {
    return useQuery({
        queryKey: categoriesQueryKeys.active(),
        queryFn: () => getActiveCategories(),
        ...options,
    });
}

/**
 * Get single category by ID
 */
export function useCategory(
    categoryId: string,
    options?: Omit<UseQueryOptions<CategoryWithCount, CategoriesApiError>, "queryKey" | "queryFn">
) {
    return useQuery({
        queryKey: categoriesQueryKeys.detail(categoryId),
        queryFn: () => getCategory(categoryId),
        enabled: !!categoryId,
        ...options,
    });
}

/**
 * Create category mutation
 */
export function useCreateCategory(
    options?: Omit<UseMutationOptions<Category, CategoriesApiError, CreateCategoryRequest>, "mutationFn">
) {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (data) => createCategory(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: categoriesQueryKeys.list() });
        },
        ...options,
    });
}

/**
 * Update category mutation
 */
export function useUpdateCategory(
    options?: Omit<UseMutationOptions<Category, CategoriesApiError, { id: string; data: UpdateCategoryRequest }>, "mutationFn">
) {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, data }) => updateCategory(id, data),
        onSuccess: (_, { id }) => {
            queryClient.invalidateQueries({ queryKey: categoriesQueryKeys.list() });
            queryClient.invalidateQueries({ queryKey: categoriesQueryKeys.detail(id) });
        },
        ...options,
    });
}

/**
 * Delete category mutation
 */
export function useDeleteCategory(
    options?: Omit<UseMutationOptions<void, CategoriesApiError, string>, "mutationFn">
) {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (id) => deleteCategory(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: categoriesQueryKeys.list() });
        },
        ...options,
    });
}
