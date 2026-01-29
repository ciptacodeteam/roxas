"use client";

/**
 * Client-side auth helpers for optimized login flow
 */

/**
 * Optimistic redirect after login
 * Redirects immediately without waiting for role validation
 */
export function optimisticRedirect(url: string) {
  // Use window.location for full page reload
  window.location.href = url;
}

/**
 * Background role validation (non-blocking)
 * Used after optimistic redirect for logging/monitoring
 */
export async function backgroundRoleCheck(): Promise<void> {
  try {
    const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
    const response = await fetch(`${API_BASE_URL}/api/v1/token/me/`, {
      credentials: "include",
    });
    const data = await response.json();
    
    if (!response.ok) {
      console.warn("Background role check failed:", data);
    }
    
    return data;
  } catch (error) {
    // Silently fail
    console.error("Background role check error:", error);
  }
}

/**
 * Fast login redirect helper
 * Shows success toast and redirects immediately
 */
export function handleSuccessfulLogin(
  locale: string,
  isAdmin: boolean = false,
  showToast: (message: string, description: string) => void
) {
  const destination = isAdmin ? '/admin' : `/${locale}/profile?from=login`;
  const message = isAdmin ? "Login Successful" : "Login Berhasil";
  const description = isAdmin 
    ? "Redirecting to admin dashboard..." 
    : "Mengarahkan ke profil Anda...";
  
  // Show success message
  showToast(message, description);
  
  // Immediate redirect
  optimisticRedirect(destination);
  
  // Background validation (non-blocking)
  backgroundRoleCheck();
}

