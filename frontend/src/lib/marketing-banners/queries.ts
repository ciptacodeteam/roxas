/**
 * Marketing Banners React Query Hooks
 * Queries and mutations for marketing banner management
 */

import {
  useQuery,
  useMutation,
  useQueryClient,
  type UseQueryOptions,
  type UseMutationOptions,
} from "@tanstack/react-query";

import {
  getMarketingBanners,
  getActiveMarketingBanners,
  getMarketingBanner,
  createMarketingBanner,
  updateMarketingBanner,
  deleteMarketingBanner,
} from "./api";
import type {
  MarketingBanner,
  CreateMarketingBannerRequest,
  UpdateMarketingBannerRequest,
  MarketingBannerListParams,
} from "./types";

/**
 * Query keys for marketing banners
 */
export const marketingBannersKeys = {
  all: ["marketing-banners"] as const,
  lists: () => [...marketingBannersKeys.all, "list"] as const,
  list: (params?: MarketingBannerListParams) => [...marketingBannersKeys.lists(), params] as const,
  active: () => [...marketingBannersKeys.all, "active"] as const,
  details: () => [...marketingBannersKeys.all, "detail"] as const,
  detail: (id: string) => [...marketingBannersKeys.details(), id] as const,
};

/**
 * Query: Get marketing banners list (Admin)
 */
export function useMarketingBanners(
  params?: MarketingBannerListParams,
  options?: Omit<
    UseQueryOptions<MarketingBanner[], Error>,
    "queryKey" | "queryFn"
  >
) {
  return useQuery({
    queryKey: marketingBannersKeys.list(params),
    queryFn: () => getMarketingBanners(params),
    staleTime: 30 * 1000, // 30 seconds
    ...options,
  });
}

/**
 * Query: Get active marketing banners (Public)
 */
export function useActiveMarketingBanners(
  options?: Omit<
    UseQueryOptions<MarketingBanner[], Error>,
    "queryKey" | "queryFn"
  >
) {
  return useQuery({
    queryKey: marketingBannersKeys.active(),
    queryFn: () => getActiveMarketingBanners(),
    staleTime: 30 * 1000, // 30 seconds
    ...options,
  });
}

/**
 * Query: Get single marketing banner
 */
export function useMarketingBanner(
  id: string,
  options?: Omit<UseQueryOptions<MarketingBanner, Error>, "queryKey" | "queryFn">
) {
  return useQuery({
    queryKey: marketingBannersKeys.detail(id),
    queryFn: () => getMarketingBanner(id),
    staleTime: 30 * 1000, // 30 seconds
    ...options,
  });
}

/**
 * Mutation: Create marketing banner
 */
export function useCreateMarketingBanner(
  options?: UseMutationOptions<MarketingBanner, Error, CreateMarketingBannerRequest>
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createMarketingBanner,
    onSuccess: async (data, variables, context) => {
      await queryClient.invalidateQueries({ queryKey: marketingBannersKeys.all });
      options?.onSuccess?.(data, variables, context);
    },
    ...options,
  });
}

/**
 * Mutation: Update marketing banner
 */
export function useUpdateMarketingBanner(
  options?: UseMutationOptions<
    MarketingBanner,
    Error,
    { id: string; data: UpdateMarketingBannerRequest }
  >
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }) => updateMarketingBanner(id, data),
    onSuccess: async (data, variables, context) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: marketingBannersKeys.all }),
        queryClient.invalidateQueries({
          queryKey: marketingBannersKeys.detail(variables.id),
        }),
      ]);
      options?.onSuccess?.(data, variables, context);
    },
    ...options,
  });
}

/**
 * Mutation: Delete marketing banner
 */
export function useDeleteMarketingBanner(
  options?: UseMutationOptions<void, Error, string>
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteMarketingBanner,
    onSuccess: async (data, variables, context) => {
      await queryClient.invalidateQueries({ queryKey: marketingBannersKeys.all });
      options?.onSuccess?.(data, variables, context);
    },
    ...options,
  });
}
