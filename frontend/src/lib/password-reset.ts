/**
 * Password Reset API and Hooks
 * Shared functionality for both admin and public password reset
 */

import { env } from "@/env";
import { useMutation, type UseMutationOptions } from "@tanstack/react-query";

const API_URL = env.NEXT_PUBLIC_BACKEND_API_URL || "http://localhost:8000";

// ==================== TYPES ====================

export interface RequestPasswordResetData {
  email: string;
}

export interface RequestPasswordResetResponse {
  detail: string;
}

export interface ResetPasswordConfirmData {
  new_password: string;
}

export interface ResetPasswordConfirmResponse {
  detail: string;
  email: string;
}

// ==================== API FUNCTIONS ====================

/**
 * Request password reset email
 */
export async function requestPasswordReset(
  data: RequestPasswordResetData
): Promise<RequestPasswordResetResponse> {
  const response = await fetch(`${API_URL}/api/v1/request-password-reset/`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  const result = await response.json();

  if (!response.ok) {
    throw new Error(result.detail || "Failed to request password reset");
  }

  return result;
}

/**
 * Confirm password reset with new password
 */
export async function resetPasswordConfirm(
  uidb64: string,
  token: string,
  data: ResetPasswordConfirmData
): Promise<ResetPasswordConfirmResponse> {
  const response = await fetch(
    `${API_URL}/api/v1/reset-password/${uidb64}/${token}/`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    }
  );

  const result = await response.json();

  if (!response.ok) {
    // Handle validation errors
    if (result.new_password) {
      throw new Error(
        Array.isArray(result.new_password)
          ? result.new_password.join(" ")
          : result.new_password
      );
    }
    throw new Error(result.detail || "Failed to reset password");
  }

  return result;
}

// ==================== REACT QUERY HOOKS ====================

/**
 * Hook to request password reset
 */
export function useRequestPasswordReset(
  options?: UseMutationOptions<
    RequestPasswordResetResponse,
    Error,
    RequestPasswordResetData
  >
) {
  return useMutation({
    mutationFn: requestPasswordReset,
    ...options,
  });
}

/**
 * Hook to confirm password reset
 */
export function useResetPasswordConfirm(
  uidb64: string,
  token: string,
  options?: UseMutationOptions<
    ResetPasswordConfirmResponse,
    Error,
    ResetPasswordConfirmData
  >
) {
  return useMutation({
    mutationFn: (data: ResetPasswordConfirmData) =>
      resetPasswordConfirm(uidb64, token, data),
    ...options,
  });
}
