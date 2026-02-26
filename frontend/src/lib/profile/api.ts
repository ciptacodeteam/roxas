import { API_URL } from "@/lib/api-url";

const API_BASE_URL = API_URL;

// ==================== TYPES ====================

export interface CustomerProfile {
  id: number;
  user: number;
  user_data: {
    id: number;
    email: string;
    role: string;
    google_id?: string | null;
    email_verified: boolean;
    email_verified_at: string | null;
    is_active: boolean;
    is_staff: boolean;
    is_superuser: boolean;
    last_login: string | null;
    date_joined: string;
  };
  full_name: string;
  contact_phone: string;
  photo: string | null;
  created_at: string;
  updated_at: string;
}

export interface UpdateProfileRequest {
  full_name?: string;
  contact_phone?: string;
  photo?: string | null;
}

export interface ChangePasswordRequest {
  old_password: string;
  new_password: string;
}

export interface ChangePasswordResponse {
  detail: string;
}

// ==================== API FUNCTIONS ====================

/**
 * Get current customer profile
 */
export async function getProfileApi(): Promise<CustomerProfile> {
  const response = await fetch(`${API_BASE_URL}/api/v1/customers/me/profile/`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: "Failed to fetch profile" }));
    throw new Error(error.detail || "Failed to fetch profile");
  }

  return response.json();
}

/**
 * Update current customer profile
 */
export async function updateProfileApi(data: UpdateProfileRequest): Promise<CustomerProfile> {
  const response = await fetch(`${API_BASE_URL}/api/v1/customers/me/profile/update_me/`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: "Failed to update profile" }));
    throw new Error(error.detail || "Failed to update profile");
  }

  return response.json();
}

/**
 * Change password for current user
 */
export async function changePasswordApi(data: ChangePasswordRequest): Promise<ChangePasswordResponse> {
  const response = await fetch(`${API_BASE_URL}/api/v1/password/change/`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: "Failed to change password" }));
    
    // Handle specific error messages
    if (error.old_password) {
      throw new Error(Array.isArray(error.old_password) ? error.old_password[0] : error.old_password);
    }
    if (error.new_password) {
      throw new Error(Array.isArray(error.new_password) ? error.new_password[0] : error.new_password);
    }
    
    throw new Error(error.detail || "Failed to change password");
  }

  return response.json();
}

/**
 * Upload profile photo
 */
export async function uploadProfilePhotoApi(file: File): Promise<{ photo: string }> {
  const formData = new FormData();
  formData.append("photo", file);

  const response = await fetch(`${API_BASE_URL}/api/v1/customers/me/profile/me/`, {
    method: "PATCH",
    credentials: "include",
    body: formData, // Send as FormData, not JSON
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: "Failed to upload photo" }));
    throw new Error(error.detail || "Failed to upload photo");
  }

  return response.json();
}
