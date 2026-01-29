"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Save, User, Mail, Lock, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";

// UI Components
import { Input } from "@/components/ui/input";
import { PhoneInputWithCountry } from "@/components/ui/phone-input-with-country";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { AppSidebar } from "@/components/app-sidebar";
import { AdminHeader } from "@/components/admin-header";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

// Auth & Admin
import { useAuth } from "@/lib/auth";
import {
  useStaffProfile,
  useCreateStaffProfile,
  useUpdateStaffProfile,
  useChangePassword,
  updateProfileSchema,
  changePasswordSchema,
  type UpdateProfileFormData,
  type ChangePasswordFormData,
} from "@/lib/admin";

export default function AdminAccountPage() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false,
  });

  // React Query hooks
  const { data: profileData, isLoading: profileLoading, error: profileError } = useStaffProfile();
  const createProfile = useCreateStaffProfile();
  const updateProfile = useUpdateStaffProfile();
  const changePasswordMutation = useChangePassword();

  // Form: Profile
  const {
    register: registerProfile,
    handleSubmit: handleProfileSubmit,
    formState: { errors: profileErrors },
    control: profileControl,
    setValue: setProfileValue,
  } = useForm<UpdateProfileFormData>({
    resolver: zodResolver(updateProfileSchema),
  });

  // Form: Password
  const {
    register: registerPassword,
    handleSubmit: handlePasswordSubmit,
    formState: { errors: passwordErrors },
    reset: resetPasswordForm,
  } = useForm<ChangePasswordFormData>({
    resolver: zodResolver(changePasswordSchema),
  });

  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      router.replace("/admin/login");
    }
  }, [user, authLoading, router]);

  // Auto-create profile if it doesn't exist
  useEffect(() => {
    if (profileError && !profileLoading && !createProfile.isPending) {
      const defaultName = user?.name || user?.email?.split('@')[0] || "Admin";
      
      createProfile.mutate(
        { full_name: defaultName, contact_phone: "" },
        {
          onSuccess: () => {
            toast.success("Profile created successfully");
          },
          onError: (error) => {
            toast.error("Failed to create profile", {
              description: error.message,
            });
          },
        }
      );
    }
  }, [profileError, profileLoading, createProfile, user]);

  // Populate form when profile data loads
  useEffect(() => {
    if (profileData) {
      console.log("Profile Data:", profileData);
      console.log("User Data:", profileData.user_data);
      console.log("Email:", profileData.user_data?.email);
      setProfileValue("full_name", profileData.full_name || "");
      setProfileValue("contact_phone", profileData.contact_phone || "");
    }
  }, [profileData, setProfileValue]);

  // Handle profile update
  const handleProfileUpdate = (data: UpdateProfileFormData) => {
    updateProfile.mutate(data, {
      onSuccess: () => {
        toast.success("Profile updated successfully", {
          description: "Your profile has been updated.",
        });
        setTimeout(() => window.location.reload(), 500);
      },
      onError: (error) => {
        toast.error("Update failed", {
          description: error.message,
        });
      },
    });
  };

  // Handle password change
  const handlePasswordChange = (data: ChangePasswordFormData) => {
    changePasswordMutation.mutate(
      {
        old_password: data.old_password,
        new_password: data.new_password,
      },
      {
        onSuccess: () => {
          toast.success("Password changed successfully", {
            description: "Your password has been updated.",
          });
          resetPasswordForm();
        },
        onError: (error) => {
          toast.error("Password change failed", {
            description: error.message,
          });
        },
      }
    );
  };

  const isLoading = authLoading || profileLoading || createProfile.isPending;

  if (isLoading) {
    return (
      <SidebarProvider
        style={
          {
            "--sidebar-width": "calc(var(--spacing) * 72)",
            "--header-height": "calc(var(--spacing) * 12)",
          } as React.CSSProperties
        }
      >
        <AppSidebar variant="inset" />
        <SidebarInset>
          <AdminHeader />
          <div className="flex flex-1 flex-col">
            <div className="@container/main flex flex-1 flex-col gap-2">
              <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
                <div className="container mx-auto px-4 lg:px-6">
                  <div className="flex items-center justify-center min-h-[400px]">
                    <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </SidebarInset>
      </SidebarProvider>
    );
  }

  return (
    <SidebarProvider
      style={
        {
          "--sidebar-width": "calc(var(--spacing) * 72)",
          "--header-height": "calc(var(--spacing) * 12)",
        } as React.CSSProperties
      }
    >
      <AppSidebar variant="inset" />
      <SidebarInset>
        <AdminHeader />
        <div className="flex flex-1 flex-col">
          <div className="@container/main flex flex-1 flex-col gap-2">
            <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
              <div className="container mx-auto px-4 lg:px-6">
                {/* Header */}
                <div className="mb-6">
                  <div>
                    <h1 className="text-3xl font-bold">Account Settings</h1>
                    <p className="text-gray-400">Manage your account preferences and security settings</p>
                  </div>
                </div>

                <Separator className="bg-gray-700 mb-6" />

                {/* Main Content */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Left Column - Forms */}
                  <div className="lg:col-span-2 space-y-6">
                    {/* Edit Profile Card */}
                    <Card className="bg-gray-900 border-gray-800">
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <User className="h-5 w-5" />
                          Edit Profile
                        </CardTitle>
                        <CardDescription>
                          Update your account information
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <form onSubmit={handleProfileSubmit(handleProfileUpdate)} className="space-y-6">
                          {/* Email (Read-only) */}
                          <div className="space-y-2">
                            <Label htmlFor="email" className="flex items-center gap-2">
                              <Mail className="h-4 w-4" />
                              Email Address
                            </Label>
                            <Input
                              id="email"
                              type="email"
                              value={profileData?.user_data?.email || ""}
                              disabled
                              className="bg-gray-800 text-gray-400 border-gray-700 cursor-not-allowed"
                            />
                            <p className="text-xs text-gray-500">
                              Email cannot be changed
                            </p>
                          </div>

                          <Separator className="bg-gray-700" />

                          {/* Name */}
                          <div className="space-y-2">
                            <Label htmlFor="full_name" className="flex items-center gap-2">
                              <User className="h-4 w-4" />
                              Full Name <span className="text-red-400">*</span>
                            </Label>
                            <Input
                              id="full_name"
                              type="text"
                              placeholder="Enter your full name"
                              {...registerProfile("full_name")}
                              className={`bg-gray-800 text-gray-100 border-gray-700 ${
                                profileErrors.full_name ? "border-red-500" : ""
                              }`}
                            />
                            {profileErrors.full_name && (
                              <p className="text-xs text-red-500">{profileErrors.full_name.message}</p>
                            )}
                            <p className="text-xs text-gray-500">
                              This name will be displayed in the admin panel
                            </p>
                          </div>

                          <Separator className="bg-gray-700" />

                          {/* Phone */}
                          <div className="space-y-2">
                            <Label htmlFor="contact_phone" className="flex items-center gap-2">
                              <Mail className="h-4 w-4" />
                              Phone Number
                            </Label>
                            <Controller
                              name="contact_phone"
                              control={profileControl}
                              render={({ field }) => (
                                <PhoneInputWithCountry
                                  id="contact_phone"
                                  value={field.value || ""}
                                  onChange={field.onChange}
                                  onBlur={field.onBlur}
                                  placeholder="Enter phone number"
                                  error={profileErrors.contact_phone?.message}
                                />
                              )}
                            />
                            <p className="text-xs text-gray-500">
                              Select your country code and enter your phone number
                            </p>
                          </div>

                          {/* Form Actions */}
                          <div className="flex justify-end gap-3 pt-4">
                            <Button
                              type="button"
                              variant="outline"
                              onClick={() => router.back()}
                              className="bg-gray-800 text-gray-100 border-gray-700 hover:bg-gray-700"
                            >
                              Cancel
                            </Button>
                            <Button
                              type="submit"
                              disabled={updateProfile.isPending}
                              className="bg-primary hover:bg-primary/90"
                            >
                              {updateProfile.isPending ? (
                                <>
                                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                  Saving...
                                </>
                              ) : (
                                <>
                                  <Save className="mr-2 h-4 w-4" />
                                  Save Changes
                                </>
                              )}
                            </Button>
                          </div>
                        </form>
                      </CardContent>
                    </Card>

                    {/* Change Password Card */}
                    <Card className="bg-gray-900 border-gray-800">
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Lock className="h-5 w-5" />
                          Change Password
                        </CardTitle>
                        <CardDescription>
                          Update your account password
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <form onSubmit={handlePasswordSubmit(handlePasswordChange)} className="space-y-6">
                          {/* Current Password */}
                          <div className="space-y-2">
                            <Label htmlFor="old_password" className="flex items-center gap-2">
                              <Lock className="h-4 w-4" />
                              Current Password <span className="text-red-400">*</span>
                            </Label>
                            <div className="relative">
                              <Input
                                id="old_password"
                                type={showPasswords.current ? "text" : "password"}
                                placeholder="Enter your current password"
                                {...registerPassword("old_password")}
                                className={`bg-gray-800 text-gray-100 border-gray-700 pr-10 ${
                                  passwordErrors.old_password ? "border-red-500" : ""
                                }`}
                              />
                              <button
                                type="button"
                                onClick={() => setShowPasswords(prev => ({ ...prev, current: !prev.current }))}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-300"
                              >
                                {showPasswords.current ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                              </button>
                            </div>
                            {passwordErrors.old_password && (
                              <p className="text-xs text-red-500">{passwordErrors.old_password.message}</p>
                            )}
                          </div>

                          <Separator className="bg-gray-700" />

                          {/* New Password */}
                          <div className="space-y-2">
                            <Label htmlFor="new_password" className="flex items-center gap-2">
                              <Lock className="h-4 w-4" />
                              New Password <span className="text-red-400">*</span>
                            </Label>
                            <div className="relative">
                              <Input
                                id="new_password"
                                type={showPasswords.new ? "text" : "password"}
                                placeholder="Enter your new password"
                                {...registerPassword("new_password")}
                                className={`bg-gray-800 text-gray-100 border-gray-700 pr-10 ${
                                  passwordErrors.new_password ? "border-red-500" : ""
                                }`}
                              />
                              <button
                                type="button"
                                onClick={() => setShowPasswords(prev => ({ ...prev, new: !prev.new }))}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-300"
                              >
                                {showPasswords.new ? (
                                  <EyeOff className="h-4 w-4" />
                                ) : (
                                  <Eye className="h-4 w-4" />
                                )}
                              </button>
                            </div>
                            {passwordErrors.new_password && (
                              <p className="text-xs text-red-500">{passwordErrors.new_password.message}</p>
                            )}
                            <p className="text-xs text-gray-500">
                              Must be at least 8 characters long
                            </p>
                          </div>

                          <Separator className="bg-gray-700" />

                          {/* Confirm Password */}
                          <div className="space-y-2">
                            <Label htmlFor="confirmPassword" className="flex items-center gap-2">
                              <Lock className="h-4 w-4" />
                              Confirm Password <span className="text-red-400">*</span>
                            </Label>
                            <div className="relative">
                              <Input
                                id="confirmPassword"
                                type={showPasswords.confirm ? "text" : "password"}
                                placeholder="Confirm your new password"
                                {...registerPassword("confirmPassword")}
                                className={`bg-gray-800 text-gray-100 border-gray-700 pr-10 ${
                                  passwordErrors.confirmPassword ? "border-red-500" : ""
                                }`}
                              />
                              <button
                                type="button"
                                onClick={() => setShowPasswords(prev => ({ ...prev, confirm: !prev.confirm }))}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-300"
                              >
                                {showPasswords.confirm ? (
                                  <EyeOff className="h-4 w-4" />
                                ) : (
                                  <Eye className="h-4 w-4" />
                                )}
                              </button>
                            </div>
                            {passwordErrors.confirmPassword && (
                              <p className="text-xs text-red-500">{passwordErrors.confirmPassword.message}</p>
                            )}
                          </div>

                          {/* Form Actions */}
                          <div className="flex justify-end gap-3 pt-4">
                            <Button
                              type="button"
                              variant="outline"
                              onClick={() => resetPasswordForm()}
                              className="bg-gray-800 text-gray-100 border-gray-700 hover:bg-gray-700"
                            >
                              Clear
                            </Button>
                            <Button
                              type="submit"
                              disabled={changePasswordMutation.isPending}
                              className="bg-primary hover:bg-primary/90"
                            >
                              {changePasswordMutation.isPending ? (
                                <>
                                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                  Changing...
                                </>
                              ) : (
                                <>
                                  <Lock className="mr-2 h-4 w-4" />
                                  Change Password
                                </>
                              )}
                            </Button>
                          </div>
                        </form>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Right Column - Info Card */}
                  <div className="lg:col-span-1">
                    <Card className="bg-gray-900 border-gray-800">
                      <CardHeader>
                        <CardTitle className="text-lg">Account Details</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div>
                          <p className="text-xs text-gray-500 mb-1">Email</p>
                          <p className="text-sm text-gray-300">
                            {profileData?.user_data?.email || "-"}
                          </p>
                        </div>
                        <Separator className="bg-gray-700" />
                        <div>
                          <p className="text-xs text-gray-500 mb-1">Role</p>
                          <p className="text-sm text-gray-300">
                            {profileData?.user_data?.role === "STAFF" ? "Admin Staff" : "Customer"}
                          </p>
                        </div>
                        <Separator className="bg-gray-700" />
                        <div>
                          <p className="text-xs text-gray-500 mb-1">Full Name</p>
                          <p className="text-sm text-gray-300">
                            {profileData?.full_name || "Not set"}
                          </p>
                        </div>
                        <Separator className="bg-gray-700" />
                        <div>
                          <p className="text-xs text-gray-500 mb-1">Phone Number</p>
                          <p className="text-sm text-gray-300">
                            {profileData?.contact_phone || "Not set"}
                          </p>
                        </div>
                        <Separator className="bg-gray-700" />
                        <div>
                          <p className="text-xs text-gray-500 mb-1">Account Status</p>
                          <p className="text-sm text-gray-300">
                            {profileData?.user_data?.is_active ? "Active" : "Inactive"}
                          </p>
                        </div>
                        <Separator className="bg-gray-700" />
                        <div>
                          <p className="text-xs text-gray-500 mb-1">Email Verified</p>
                          <p className="text-sm text-gray-300">
                            {profileData?.user_data?.email_verified ? "Yes" : "No"}
                          </p>
                        </div>
                        <Separator className="bg-gray-700" />
                        <div>
                          <p className="text-xs text-gray-500 mb-1">Created At</p>
                          <p className="text-sm text-gray-300">
                            {profileData?.created_at ? new Date(profileData.created_at).toLocaleDateString("en-US", { 
                              year: "numeric", 
                              month: "long", 
                              day: "numeric",
                              hour: "2-digit",
                              minute: "2-digit"
                            }) : "-"}
                          </p>
                        </div>
                        <Separator className="bg-gray-700" />
                        <div>
                          <p className="text-xs text-gray-500 mb-1">Updated At</p>
                          <p className="text-sm text-gray-300">
                            {profileData?.updated_at ? new Date(profileData.updated_at).toLocaleDateString("en-US", { 
                              year: "numeric", 
                              month: "long", 
                              day: "numeric",
                              hour: "2-digit",
                              minute: "2-digit"
                            }) : "-"}
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        </SidebarInset>
      </SidebarProvider>
    );
  }
