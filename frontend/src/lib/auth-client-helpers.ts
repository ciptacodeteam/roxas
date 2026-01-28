"use client";

/**
 * Client-side auth helpers for optimized login flow
 */

/**
 * Optimistic redirect after login
 * Redirects immediately without waiting for role validation
 * The middleware will handle role-based redirects if needed
 */
export function optimisticRedirect(url: string) {
  // Use window.location for full page reload to ensure middleware runs
  window.location.href = url;
}

/**
 * Background role validation (non-blocking)
 * Used after optimistic redirect for logging/monitoring
 */
export async function backgroundRoleCheck(): Promise<void> {
  try {
    const response = await fetch("/api/auth/check-role");
    const data = await response.json();
    
    if (!data.success) {
      console.warn("Background role check failed:", data);
    }
    
    return data;
  } catch (error) {
    // Silently fail - middleware will handle authentication
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

