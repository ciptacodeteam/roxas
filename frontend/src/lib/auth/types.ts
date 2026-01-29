/**
 * Authentication Types
 * Centralized type definitions for authentication
 */

// User types from Django backend
export interface User {
  id: number;
  email: string;
  name?: string;
  phone?: string;
  full_name?: string;
  profile_picture_url?: string;
  role?: string;
  is_staff: boolean;
  is_superuser: boolean;
  is_active: boolean;
  date_joined: string;
}

// Auth response types
export interface LoginResponse {
  access: string;
  refresh: string;
  user: User;
}

export interface RegisterResponse {
  user: User;
  message: string;
}

export interface SessionResponse {
  user: User;
}

// Request types
export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  name?: string;
  phone?: string;
}

export interface ChangePasswordRequest {
  old_password: string;
  new_password: string;
}

// Auth state
export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isAdmin: boolean;
}

// Error types
export interface AuthError {
  message: string;
  details?: Record<string, string[]>;
}
