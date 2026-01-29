/**
 * Users Module Types
 * Type definitions for user management
 */

export interface UserData {
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

export interface StaffUser {
  id: number;
  user: number;
  user_data: UserData;
  full_name: string;
  contact_phone: string | null;
  photo: string | null;
  created_at: string;
  updated_at: string;
}

export interface CustomerUser {
  id: number;
  user: number;
  user_data: UserData;
  full_name: string;
  contact_phone: string | null;
  photo: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateUserRequest {
  email: string;
  password: string;
  full_name: string;
  contact_phone?: string;
  role: "STAFF" | "CUSTOMER";
}

export interface UpdateUserRequest {
  full_name?: string;
  contact_phone?: string;
}

export interface UserListParams {
  search?: string;
  is_active?: boolean;
  page?: number;
  page_size?: number;
}

export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}
