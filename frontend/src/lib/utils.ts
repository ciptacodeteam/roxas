import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { API_URL } from "@/lib/api-url"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Extracts a human-readable error message from a Django REST Framework API error response.
 *
 * The backend custom exception handler wraps errors in:
 *   { success: false, error: { message, details: { field: ["msg"] }, errors: { field: ["msg"] } } }
 *
 * Plain DRF responses can also be:
 *   { detail: "string" }
 *   { non_field_errors: ["msg"] }
 *   { field_name: ["msg"] }
 *
 * Priority (most specific → most generic):
 *   1. Field-level message from nested `error.errors` or `error.details`
 *   2. Nested `error.message` (user-friendly generic from custom handler)
 *   3. Bare `detail` string
 *   4. Bare `non_field_errors[0]`
 *   5. Bare field-level array first value
 *   6. `fallback`
 */
export function extractApiErrorMessage(
  error: Record<string, unknown>,
  fallback: string
): string {
  if (!error || typeof error !== "object") return fallback;

  // ── Custom exception handler wrapper ─────────────────────────────────────
  const nested = error.error;
  if (nested && typeof nested === "object") {
    const n = nested as Record<string, unknown>;

    // 1. Field-level messages from errors/details inside the wrapper
    for (const key of ["errors", "details"] as const) {
      const fieldMap = n[key];
      if (fieldMap && typeof fieldMap === "object" && !Array.isArray(fieldMap)) {
        for (const value of Object.values(fieldMap as Record<string, unknown>)) {
          if (Array.isArray(value) && value.length > 0) return String(value[0]);
        }
      }
    }

    // 2. Generic user-friendly message from wrapper
    if (typeof n.message === "string" && n.message) return n.message;
  }

  // ── Plain DRF responses ───────────────────────────────────────────────────
  // 3. Standard detail string
  if (typeof error.detail === "string") return error.detail;

  // 4. Non-field errors array
  if (Array.isArray(error.non_field_errors) && error.non_field_errors.length > 0) {
    return String(error.non_field_errors[0]);
  }

  // 5. Bare field-level validation errors
  for (const value of Object.values(error)) {
    if (Array.isArray(value) && value.length > 0) return String(value[0]);
  }

  return fallback;
}

/**
 * Build full image URL from backend response
 * Handles both absolute URLs and relative paths
 */
export function getImageUrl(imageUrl: string | null | undefined, fallback: string = "/img/placeholder.webp"): string {
  if (!imageUrl) return fallback;

  // If already an absolute URL, return as is
  if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
    return imageUrl;
  }

  // Build full URL with backend API URL
  const backendUrl = API_URL;
  const cleanPath = imageUrl.startsWith('/') ? imageUrl : `/${imageUrl}`;

  return `${backendUrl}${cleanPath}`;
}

/**
 * Get product image with fallback to static images based on slug
 */
export function getProductImage(imageUrl: string | null | undefined, slug?: string): string {
  // If image URL exists, use it
  if (imageUrl) {
    return getImageUrl(imageUrl);
  }

  // Fallback to static images based on slug
  const slugImageMap: Record<string, string> = {
    'mobile-legends': '/games/ml.webp',
    'mobile-legends-mlbb': '/games/ml.webp',
    'mobile-legends-login': '/games/ml2.webp',
    'mobile-legends-via-login': '/games/ml2.webp',
    'free-fire': '/games/ff.webp',
    'free-fire-garena': '/games/ff.webp',
    'pubg-mobile': '/games/pubg.webp',
    'roblox-robux': '/games/roblox.webp',
    'roblox-gamepass': '/games/roblox2.webp',
    'roblox-gamepass-robux': '/games/roblox2.webp',
    'roblox-via-login': '/games/roblox.webp',
    'pulsa-telkomsel': '/games/pulsa.webp',
  };

  return slug && slugImageMap[slug] ? slugImageMap[slug] : '/img/ffcover.webp';
}
