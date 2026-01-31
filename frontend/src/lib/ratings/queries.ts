/**
 * Ratings React Query Hooks
 */

import {
    useQuery,
    useMutation,
    useQueryClient,
    type UseQueryOptions,
    type UseMutationOptions,
} from "@tanstack/react-query";
import { getRatings, getRating, updateRating, deleteRating } from "./api";
import type { Rating, RatingFilters, UpdateRatingRequest } from "./types";

/**
 * Query keys for ratings
 */
export const ratingsQueryKeys = {
    all: ["ratings"],
    lists: () => [...ratingsQueryKeys.all, "list"],
    list: (filters?: RatingFilters) => [
        ...ratingsQueryKeys.lists(),
        filters,
    ],
    details: () => [...ratingsQueryKeys.all, "detail"],
    detail: (id: string) => [...ratingsQueryKeys.details(), id],
};

/**
 * Get all ratings
 */
export function useRatings(
    filters?: RatingFilters,
    options?: Omit<UseQueryOptions<Rating[]>, "queryKey" | "queryFn">
) {
    return useQuery({
        queryKey: ratingsQueryKeys.list(filters),
        queryFn: () => getRatings(filters),
        staleTime: 1000 * 60 * 5, // 5 minutes
        ...options,
    });
}

/**
 * Get single rating
 */
export function useRating(
    id: string,
    options?: Omit<UseQueryOptions<Rating>, "queryKey" | "queryFn">
) {
    return useQuery({
        queryKey: ratingsQueryKeys.detail(id),
        queryFn: () => getRating(id),
        enabled: !!id,
        ...options,
    });
}

/**
 * Update rating mutation
 */
export function useUpdateRating(
    options?: Omit<
        UseMutationOptions<Rating, Error, { id: string; data: UpdateRatingRequest }>,
        "mutationFn"
    >
) {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, data }) => updateRating(id, data),
        onSuccess: (data) => {
            queryClient.setQueryData(ratingsQueryKeys.detail(data.id), data);
            queryClient.invalidateQueries({ queryKey: ratingsQueryKeys.lists() });
        },
        ...options,
    });
}

/**
 * Delete rating mutation
 */
export function useDeleteRating(
    options?: Omit<UseMutationOptions<void, Error, string, { previousRatings: Rating[] | undefined }>, "mutationFn">
) {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: deleteRating,
        onMutate: async (deletedId) => {
            // Cancel ongoing queries
            await queryClient.cancelQueries({
                queryKey: ratingsQueryKeys.lists(),
            });

            // Get current data
            const previousRatings = queryClient.getQueryData<Rating[]>(
                ratingsQueryKeys.lists()
            );

            // Optimistic update: remove deleted rating from all filters
            if (previousRatings) {
                queryClient.setQueryData(
                    ratingsQueryKeys.lists(),
                    previousRatings.filter((rating) => rating.id !== deletedId)
                );
            }

            return { previousRatings };
        },
        onError: (err, deletedId, context) => {
            // Rollback on error
            if (context?.previousRatings) {
                queryClient.setQueryData(
                    ratingsQueryKeys.lists(),
                    context.previousRatings
                );
            }
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ratingsQueryKeys.lists() });
        },
        ...options,
    });
}
