import { useQuery, useMutation, useQueryClient, type UseQueryOptions, type UseMutationOptions } from "@tanstack/react-query";
import { getProfileApi, updateProfileApi, changePasswordApi, uploadProfilePhotoApi, type CustomerProfile, type UpdateProfileRequest, type ChangePasswordRequest, type ChangePasswordResponse } from "./api";

// ==================== QUERY KEYS ====================

export const profileKeys = {
  all: ["profile"] as const,
  current: () => [...profileKeys.all, "current"] as const,
};

// ==================== QUERIES ====================

/**
 * Hook to get current customer profile
 */
export function useProfile(options?: Omit<UseQueryOptions<CustomerProfile, Error>, "queryKey" | "queryFn">) {
  return useQuery<CustomerProfile, Error>({
    queryKey: profileKeys.current(),
    queryFn: getProfileApi,
    staleTime: 5 * 60 * 1000, // 5 minutes
    ...options,
  });
}

// ==================== MUTATIONS ====================

/**
 * Hook to update customer profile
 */
export function useUpdateProfile(
  options?: Omit<UseMutationOptions<CustomerProfile, Error, UpdateProfileRequest>, "mutationFn">
) {
  const queryClient = useQueryClient();

  return useMutation<CustomerProfile, Error, UpdateProfileRequest>({
    mutationFn: updateProfileApi,
    onSuccess: (data, variables, context) => {
      // Update cache immediately
      queryClient.setQueryData<CustomerProfile>(profileKeys.current(), data);
      // Call custom onSuccess if provided
      options?.onSuccess?.(data, variables, context);
    },
    ...options,
  });
}

/**
 * Hook to change password
 */
export function useChangePassword(
  options?: Omit<UseMutationOptions<ChangePasswordResponse, Error, ChangePasswordRequest>, "mutationFn">
) {
  return useMutation<ChangePasswordResponse, Error, ChangePasswordRequest>({
    mutationFn: changePasswordApi,
    ...options,
  });
}

/**
 * Hook to upload profile photo
 */
export function useUploadProfilePhoto(
  options?: Omit<UseMutationOptions<{ photo: string }, Error, File>, "mutationFn">
) {
  const queryClient = useQueryClient();

  return useMutation<{ photo: string }, Error, File>({
    mutationFn: uploadProfilePhotoApi,
    onSuccess: (data, variables, context) => {
      // Invalidate profile to refetch with new photo
      queryClient.invalidateQueries({ queryKey: profileKeys.current() });
      // Call custom onSuccess if provided
      options?.onSuccess?.(data, variables, context);
    },
    ...options,
  });
}
