/**
 * Admin Module Types
 * Centralized type definitions for admin functionality
 */

export interface User {
  id: number;
  email: string;
  role: "STAFF" | "CUSTOMER";
  email_verified: boolean;
  email_verified_at: string | null;
  is_active: boolean;
  is_staff: boolean;
  is_superuser: boolean;
  last_login: string | null;
  date_joined: string;
}

export interface StaffProfile {
  id: number;
  user: number; // User ID
  user_data: User; // Full user object
  full_name: string;
  contact_phone: string | null;
  photo: string | null;
  created_at: string;
  updated_at: string;
}

export interface UpdateProfileRequest {
  full_name: string;
  contact_phone?: string;
}

export interface ChangePasswordRequest {
  old_password: string;
  new_password: string;
}
