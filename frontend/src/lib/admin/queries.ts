/**
 * Admin React Query Hooks
 * Data fetching and mutations using TanStack Query
 */

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  getStaffProfile,
  createStaffProfile,
  updateStaffProfile,
  changePassword,
} from "./api";
import type { UpdateProfileRequest, ChangePasswordRequest } from "./types";

// Query keys
export const adminKeys = {
  all: ["admin"] as const,
  profile: () => [...adminKeys.all, "profile"] as const,
};

/**
 * Hook to fetch staff profile
 */
export function useStaffProfile() {
  return useQuery({
    queryKey: adminKeys.profile(),
    queryFn: getStaffProfile,
    retry: false,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Hook to create staff profile
 */
export function useCreateStaffProfile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createStaffProfile,
    onSuccess: (data) => {
      queryClient.setQueryData(adminKeys.profile(), data);
    },
  });
}

/**
 * Hook to update staff profile
 */
export function useUpdateStaffProfile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateStaffProfile,
    onSuccess: (data) => {
      queryClient.setQueryData(adminKeys.profile(), data);
    },
  });
}

/**
 * Hook to change password
 */
export function useChangePassword() {
  return useMutation({
    mutationFn: changePassword,
  });
}
