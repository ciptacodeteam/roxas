/**
 * Admin API Client
 * Handles all HTTP requests for admin functionality
 */

import type {
  StaffProfile,
  UpdateProfileRequest,
  ChangePasswordRequest,
} from "./types";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export class AdminApiError extends Error {
  constructor(
    message: string,
    public errors?: Record<string, string[]>
  ) {
    super(message);
    this.name = "AdminApiError";
  }
}

/**
 * Get staff profile for current authenticated user
 */
export async function getStaffProfile(): Promise<StaffProfile> {
  const response = await fetch(`${API_BASE_URL}/api/v1/admin/staff/me/profile/`, {
    method: "GET",
    credentials: "include",
  });

  if (!response.ok) {
    if (response.status === 404) {
      throw new AdminApiError("Profile not found", { detail: ["Profile does not exist"] });
    }
    throw new AdminApiError("Failed to fetch profile");
  }

  return response.json();
}

/**
 * Create staff profile for current user
 */
export async function createStaffProfile(data: UpdateProfileRequest): Promise<StaffProfile> {
  const response = await fetch(`${API_BASE_URL}/api/v1/admin/staff/me/profile/`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: "Failed to create profile" }));
    throw new AdminApiError(error.detail || "Failed to create profile", error.errors);
  }

  return response.json();
}

/**
 * Update staff profile
 */
export async function updateStaffProfile(data: UpdateProfileRequest): Promise<StaffProfile> {
  const response = await fetch(`${API_BASE_URL}/api/v1/admin/staff/me/profile/update_me/`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: "Failed to update profile" }));
    throw new AdminApiError(error.detail || "Failed to update profile", error.errors);
  }

  return response.json();
}

/**
 * Change password for current user
 */
export async function changePassword(data: ChangePasswordRequest): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/api/v1/change-password/`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: "Failed to change password" }));
    throw new AdminApiError(error.detail || "Failed to change password", error.errors);
  }
}
