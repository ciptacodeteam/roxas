/**
 * Authentication Utilities
 * 
 * NOTE: Backend uses HTTP-only cookies for JWT storage
 * These utilities are kept for debugging purposes only
 * Tokens are NOT stored in localStorage in production
 */

import type { User } from "./types";

interface JWTPayload {
  user_id: number;
  email: string;
  role: string;
  email_verified: boolean;
  has_customer_profile: boolean;
  full_name?: string;
  profile_picture_url?: string;
  exp: number;
  iat: number;
  jti: string;
}

/**
 * Decode JWT token without verification (for client-side use only)
 * Returns the payload or null if invalid
 * 
 * @deprecated This is only for debugging - tokens are in HTTP-only cookies
 */
export function decodeJWT(token: string): JWTPayload | null {
  try {
    // Check if token exists
    if (!token || typeof token !== "string") {
      return null;
    }

    // JWT has 3 parts: header.payload.signature
    const parts = token.split(".");
    if (parts.length !== 3) {
      return null;
    }

    // Decode the payload (middle part)
    const payload = parts[1];
    if (!payload) {
      return null;
    }
    const decoded = atob(payload.replace(/-/g, "+").replace(/_/g, "/"));
    return JSON.parse(decoded) as JWTPayload;
  } catch (error) {
    console.error("Failed to decode JWT:", error);
    return null;
  }
}

/**
 * Extract user information from JWT access token
 * 
 * @deprecated Not used - backend sends user data in response body
 */
export function getUserFromToken(accessToken: string): User | null {
  const payload = decodeJWT(accessToken);
  
  if (!payload) {
    return null;
  }

  // Map JWT payload to User type
  return {
    id: payload.user_id,
    email: payload.email,
    name: payload.full_name,
    phone: undefined, // Not in token
    is_staff: payload.role === "STAFF",
    is_superuser: payload.role === "STAFF", // Assume STAFF role implies superuser
    is_active: true, // Token exists means user is active
    date_joined: new Date().toISOString(), // Not available in token
  };
}

/**
 * Check if JWT token is expired
 * 
 * @deprecated Cannot check expiry of HTTP-only cookies from JavaScript
 */
export function isTokenExpired(token: string): boolean {
  const payload = decodeJWT(token);
  
  if (!payload || !payload.exp) {
    return true;
  }

  // exp is in seconds, Date.now() is in milliseconds
  return payload.exp * 1000 < Date.now();
}

/**
 * ===================================================================
 * DEPRECATED FUNCTIONS BELOW - NOT USED IN PRODUCTION
 * Backend uses HTTP-only cookies which cannot be accessed from JavaScript
 * ===================================================================
 */

/**
 * @deprecated Tokens are stored in HTTP-only cookies by the backend
 */
export function storeTokens(access: string, refresh: string): void {
  // Not used - tokens are automatically stored in HTTP-only cookies
  console.warn("storeTokens is deprecated - backend uses HTTP-only cookies");
}

/**
 * @deprecated Tokens are in HTTP-only cookies and cannot be accessed
 */
export function getAccessToken(): string | null {
  console.warn("getAccessToken is deprecated - tokens are in HTTP-only cookies");
  return null;
}

/**
 * @deprecated Tokens are in HTTP-only cookies and cannot be accessed
 */
export function getRefreshToken(): string | null {
  console.warn("getRefreshToken is deprecated - tokens are in HTTP-only cookies");
  return null;
}

/**
 * @deprecated Cookies are cleared by backend logout endpoint
 */
export function clearTokens(): void {
  console.warn("clearTokens is deprecated - backend clears HTTP-only cookies");
}

/**
 * @deprecated User data is fetched from /api/v1/token/me/ endpoint
 */
export function getStoredUser(): User | null {
  console.warn("getStoredUser is deprecated - use getSessionApi() instead");
  return null;
}