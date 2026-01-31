"use client";

import React from "react";

// Django API base URL
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

/**
 * Auth client for Django backend
 */
export const authClient = {
  /**
   * Sign in with email and password
   */
  async signIn(email: string, password: string) {
    const response = await fetch(`${API_BASE_URL}/api/v1/token/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email, password }),
      credentials: "include",
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || "Login failed");
    }

    return response.json();
  },

  /**
   * Sign out
   */
  async signOut() {
    const response = await fetch(`${API_BASE_URL}/api/v1/token/logout/`, {
      method: "POST",
      credentials: "include",
    });

    if (!response.ok) {
      throw new Error("Logout failed");
    }

    return response.json();
  },

  /**
   * Register a new customer
   */
  async signUp(data: {
    email: string;
    password: string;
    name?: string;
    phone?: string;
  }) {
    const response = await fetch(`${API_BASE_URL}/api/v1/register/customer/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
      credentials: "include",
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || "Registration failed");
    }

    return response.json();
  },

  /**
   * Get current user session
   */
  async getSession() {
    const response = await fetch(`${API_BASE_URL}/api/v1/token/me/`, {
      credentials: "include",
    });

    if (!response.ok) {
      return null;
    }

    return response.json();
  },
};

/**
 * Hook to get current user session (client-side only)
 */
export function useSession() {
  const [session, setSession] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    authClient
      .getSession()
      .then(setSession)
      .catch(() => setSession(null))
      .finally(() => setLoading(false));
  }, []);

  return { data: session, isPending: loading };
}

// Re-export for compatibility
export const { signIn, signOut, signUp } = authClient;

