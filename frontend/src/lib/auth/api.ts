/**
 * Authentication API Client
 * Handles all HTTP requests to Django backend
 * NOTE: Backend uses HTTP-only cookies for JWT tokens, not response body
 */

import type {
  LoginRequest,
  LoginResponse,
  RegisterRequest,
  RegisterResponse,
  SessionResponse,
  ChangePasswordRequest,
} from "./types";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

/**
 * Custom error class for auth errors
 */
export class AuthApiError extends Error {
  details?: Record<string, string[]>;

  constructor(message: string, details?: Record<string, string[]>) {
    super(message);
    this.name = "AuthApiError";
    this.details = details;
  }
}

/**
 * Login user with email and password
 * Tokens are stored in HTTP-only cookies by the backend
 */
export async function loginApi(data: LoginRequest): Promise<LoginResponse> {
  const response = await fetch(`${API_BASE_URL}/api/v1/token/`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({
      detail: "Invalid credentials",
    }));

    throw new AuthApiError(
      error.detail || error.message || "Login failed",
      error.errors
    );
  }

  const result = await response.json();

  // Backend returns user info in response body
  // Tokens are automatically stored in HTTP-only cookies
  return {
    access: "", // Token is in HTTP-only cookie
    refresh: "", // Token is in HTTP-only cookie
    user: {
      id: 0, // Will be fetched from /token/me/
      email: result.user.email,
      role: result.user.role,
      is_staff: result.user.role === "STAFF",
      is_superuser: result.user.role === "STAFF",
      is_active: true,
      date_joined: new Date().toISOString(),
    },
  };
}

/**
 * Logout current user
 * Clears HTTP-only cookies on the backend
 */
export async function logoutApi(): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/api/v1/token/logout/`, {
    method: "POST",
    credentials: "include",
  });

  if (!response.ok) {
    throw new AuthApiError("Logout failed");
  }
}

/**
 * Get current user session
 * Fetches user data using HTTP-only cookie authentication
 */
export async function getSessionApi(): Promise<SessionResponse> {
  const response = await fetch(`${API_BASE_URL}/api/v1/token/me/`, {
    method: "GET",
    credentials: "include",
  });

  if (!response.ok) {
    throw new AuthApiError("Session expired");
  }

  const data = await response.json();
  
  // Debug logging
  console.log('[getSessionApi] Raw backend response:', data);
  console.log('[getSessionApi] Request cookies:', document.cookie);

  // Backend returns user data with profile info
  // Derive is_staff from role since backend doesn't return it directly
  const isStaff = data.role === 'STAFF';
  
  const sessionData = {
    user: {
      id: data.id,
      email: data.email,
      name: data.full_name, // Use full_name as name
      phone: '', // Backend doesn't return phone in this endpoint
      full_name: data.full_name,
      profile_picture_url: data.profile_picture_url,
      role: data.role,
      is_staff: isStaff,
      is_superuser: isStaff, // Assume superuser same as staff
      is_active: true, // Assume active if endpoint returns data
      date_joined: new Date().toISOString(), // Backend doesn't return this
    },
  };
  
  console.log('[getSessionApi] Transformed session data:', sessionData);
  
  return sessionData;
}

/**
 * Register new customer
 * Backend may return tokens in HTTP-only cookies
 */
export async function registerApi(
  data: RegisterRequest
): Promise<RegisterResponse> {
  // Map frontend field names to backend field names
  const requestData = {
    email: data.email,
    password: data.password,
    full_name: data.full_name || data.name || "",
    contact_phone: data.contact_phone || data.phone || "",
  };

  const response = await fetch(`${API_BASE_URL}/api/v1/register/customer/`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
    body: JSON.stringify(requestData),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({
      detail: "Registration failed",
    }));

    throw new AuthApiError(
      error.detail || "Registration failed",
      error.errors
    );
  }

  const result = await response.json();

  return {
    user: result.user,
    message: result.message || result.detail || "Registration successful",
  };
}

/**
 * Change password for current user
 */
export async function changePasswordApi(
  data: ChangePasswordRequest
): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/api/v1/change-password/`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new AuthApiError(
      error.detail || "Password change failed",
      error.errors
    );
  }
}

/**
 * Refresh access token using HTTP-only cookie
 * Should be called periodically to keep the session alive
 */
export async function refreshTokenApi(): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/api/v1/token/refresh/`, {
    method: "POST",
    credentials: "include",
  });

  if (!response.ok) {
    throw new AuthApiError("Token refresh failed");
  }

  // Token is refreshed in HTTP-only cookie, no need to return anything
}