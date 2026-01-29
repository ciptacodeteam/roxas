/**
 * Users API Client
 * Handles HTTP requests for user management
 */

import type {
  StaffUser,
  CustomerUser,
  CreateUserRequest,
  UpdateUserRequest,
  UserListParams,
  PaginatedResponse,
} from "./types";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export class UsersApiError extends Error {
  constructor(
    message: string,
    public errors?: Record<string, string[]>
  ) {
    super(message);
    this.name = "UsersApiError";
  }
}

/**
 * Get all staff users with optional filters
 */
export async function getStaffUsers(
  params?: UserListParams
): Promise<PaginatedResponse<StaffUser>> {
  const queryParams = new URLSearchParams();
  
  if (params?.search) queryParams.append("search", params.search);
  if (params?.is_active !== undefined) queryParams.append("user__is_active", String(params.is_active));
  if (params?.page) queryParams.append("page", String(params.page));
  if (params?.page_size) queryParams.append("page_size", String(params.page_size));

  const response = await fetch(
    `${API_BASE_URL}/api/v1/admin/staff/?${queryParams}`,
    {
      method: "GET",
      credentials: "include",
    }
  );

  if (!response.ok) {
    throw new UsersApiError("Failed to fetch staff users");
  }

  return response.json();
}

/**
 * Get all customer users with optional filters
 */
export async function getCustomerUsers(
  params?: UserListParams
): Promise<PaginatedResponse<CustomerUser>> {
  const queryParams = new URLSearchParams();
  
  if (params?.search) queryParams.append("search", params.search);
  if (params?.is_active !== undefined) queryParams.append("user__is_active", String(params.is_active));
  if (params?.page) queryParams.append("page", String(params.page));
  if (params?.page_size) queryParams.append("page_size", String(params.page_size));

  const response = await fetch(
    `${API_BASE_URL}/api/v1/admin/customers/?${queryParams}`,
    {
      method: "GET",
      credentials: "include",
    }
  );

  if (!response.ok) {
    throw new UsersApiError("Failed to fetch customer users");
  }

  return response.json();
}

/**
 * Get single staff user by ID
 */
export async function getStaffUser(id: number): Promise<StaffUser> {
  const response = await fetch(
    `${API_BASE_URL}/api/v1/admin/staff/${id}/`,
    {
      method: "GET",
      credentials: "include",
    }
  );

  if (!response.ok) {
    if (response.status === 404) {
      throw new UsersApiError("User not found");
    }
    throw new UsersApiError("Failed to fetch user");
  }

  return response.json();
}

/**
 * Get single customer user by ID
 */
export async function getCustomerUser(id: number): Promise<CustomerUser> {
  const response = await fetch(
    `${API_BASE_URL}/api/v1/admin/customers/${id}/`,
    {
      method: "GET",
      credentials: "include",
    }
  );

  if (!response.ok) {
    if (response.status === 404) {
      throw new UsersApiError("User not found");
    }
    throw new UsersApiError("Failed to fetch user");
  }

  return response.json();
}

/**
 * Create new staff user
 */
export async function createStaffUser(
  data: CreateUserRequest
): Promise<StaffUser> {
  const response = await fetch(`${API_BASE_URL}/api/v1/admin/staff/`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({
      detail: "Failed to create user",
    }));
    throw new UsersApiError(
      error.detail || "Failed to create user",
      error.errors
    );
  }

  return response.json();
}

/**
 * Create new customer user
 */
export async function createCustomerUser(
  data: CreateUserRequest
): Promise<CustomerUser> {
  const response = await fetch(`${API_BASE_URL}/api/v1/admin/customers/`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({
      detail: "Failed to create user",
    }));
    throw new UsersApiError(
      error.detail || "Failed to create user",
      error.errors
    );
  }

  return response.json();
}

/**
 * Update staff user
 */
export async function updateStaffUser(
  id: number,
  data: UpdateUserRequest
): Promise<StaffUser> {
  const response = await fetch(`${API_BASE_URL}/api/v1/admin/staff/${id}/`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({
      detail: "Failed to update user",
    }));
    throw new UsersApiError(
      error.detail || "Failed to update user",
      error.errors
    );
  }

  return response.json();
}

/**
 * Update customer user
 */
export async function updateCustomerUser(
  id: number,
  data: UpdateUserRequest
): Promise<CustomerUser> {
  const response = await fetch(`${API_BASE_URL}/api/v1/admin/customers/${id}/`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({
      detail: "Failed to update user",
    }));
    throw new UsersApiError(
      error.detail || "Failed to update user",
      error.errors
    );
  }

  return response.json();
}

/**
 * Activate or deactivate user account
 */
export async function toggleUserActive(
  profileType: "staff" | "customers",
  profileId: number,
  activate: boolean
): Promise<void> {
  const response = await fetch(
    `${API_BASE_URL}/api/v1/admin/${profileType}/${profileId}/activate-deactivate/`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify({ is_active: activate }),
    }
  );

  if (!response.ok) {
    const error = await response.json().catch(() => ({
      detail: "Failed to update user status",
    }));
    throw new UsersApiError(
      error.detail || "Failed to update user status",
      error.errors
    );
  }
}

/**
 * Send email verification to user
 */
export async function sendEmailVerification(userId: number): Promise<void> {
  const response = await fetch(
    `${API_BASE_URL}/api/v1/users/${userId}/send-verification-email/`,
    {
      method: "POST",
      credentials: "include",
    }
  );

  if (!response.ok) {
    const error = await response.json().catch(() => ({
      detail: "Failed to send verification email",
    }));
    throw new UsersApiError(
      error.detail || "Failed to send verification email",
      error.errors
    );
  }
}

/**
 * Send password reset email to user
 */
export async function sendPasswordReset(userId: number): Promise<void> {
  const response = await fetch(
    `${API_BASE_URL}/api/v1/users/${userId}/reset-password/`,
    {
      method: "POST",
      credentials: "include",
    }
  );

  if (!response.ok) {
    const error = await response.json().catch(() => ({
      detail: "Failed to send password reset email",
    }));
    throw new UsersApiError(
      error.detail || "Failed to send password reset email",
      error.errors
    );
  }
}
