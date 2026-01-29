/**
 * Admin Module
 * Barrel exports for admin functionality
 */

// Types
export type {
  User,
  StaffProfile,
  UpdateProfileRequest,
  ChangePasswordRequest,
} from "./types";

// API
export {
  AdminApiError,
  getStaffProfile,
  createStaffProfile,
  updateStaffProfile,
  changePassword,
} from "./api";

// Queries
export {
  adminKeys,
  useStaffProfile,
  useCreateStaffProfile,
  useUpdateStaffProfile,
  useChangePassword,
} from "./queries";

// Schemas
export {
  updateProfileSchema,
  changePasswordSchema,
  type UpdateProfileFormData,
  type ChangePasswordFormData,
} from "./schemas";
