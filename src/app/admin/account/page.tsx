"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, Save, User, Mail, Lock, Eye, EyeOff } from "lucide-react";
import { Input } from "@/components/ui/input";
import { PhoneInput } from "@/components/ui/phone-input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { AppSidebar } from "@/components/app-sidebar";
import { AdminHeader } from "@/components/admin-header";
import {
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar";
import { toast } from "sonner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

interface AccountData {
  id: string;
  email: string;
  name: string | null;
  phone: string | null;
  image: string | null;
  hasPassword?: boolean;
}

// Validation schemas
const UpdateAccountSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name is too long'),
  phone: z.string().optional(),
});

const ChangePasswordSchema = z.object({
  newPassword: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string(),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

type UpdateAccountFormData = z.infer<typeof UpdateAccountSchema>;
type ChangePasswordFormData = z.infer<typeof ChangePasswordSchema>;

export default function AdminAccountPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [accountData, setAccountData] = useState<AccountData | null>(null);
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false,
  });

  const {
    register: registerAccount,
    handleSubmit: handleAccountSubmit,
    formState: { errors: accountErrors, isSubmitting: isSavingAccount },
    watch: watchAccount,
    setValue: setAccountValue,
    control: accountControl,
  } = useForm<UpdateAccountFormData>({
    resolver: zodResolver(UpdateAccountSchema),
  });

  const {
    register: registerPassword,
    handleSubmit: handlePasswordSubmit,
    formState: { errors: passwordErrors, isSubmitting: isChangingPassword },
    reset: resetPasswordForm,
  } = useForm<ChangePasswordFormData>({
    resolver: zodResolver(ChangePasswordSchema),
  });

  // Load account data
  useEffect(() => {
    const loadAccount = async () => {
      try {
        setLoading(true);
        const res = await fetch("/api/admin/account", {
          method: "GET",
          credentials: "include",
        });
        const data = await res.json();

        if (res.ok && data?.success && data.user) {
          setAccountData(data.user);
          setAccountValue("name", data.user.name || "");
          setAccountValue("phone", data.user.phone || "");
        } else if (res.status === 401) {
          router.replace("/admin/login");
        } else {
          toast.error("Failed to load account", {
            description: data.message || "Please try again.",
          });
        }
      } catch (error) {
        console.error("Failed to load account", error);
        toast.error("Failed to load account", {
          description: "Please try again.",
        });
      } finally {
        setLoading(false);
      }
    };

    loadAccount();
  }, [router]);

  const handleAccountUpdate = async (data: UpdateAccountFormData) => {
    try {
      const res = await fetch("/api/admin/account", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(data),
      });

      const responseData = await res.json();

      if (res.ok && responseData.success) {
        toast.success("Account updated successfully", {
          description: "Your profile has been updated.",
        });
        // Reload to ensure sidebar picks up new name
        setTimeout(() => {
          window.location.reload();
        }, 500);
      } else {
        toast.error("Update failed", {
          description: responseData.message || "Please check your input.",
        });
      }
    } catch (error) {
      console.error("Update account error", error);
      toast.error("Update failed", {
        description: "An error occurred. Please try again.",
      });
    }
  };

  const handlePasswordChange = async (data: ChangePasswordFormData) => {
    try {
      const res = await fetch("/api/admin/account", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(data),
      });

      const responseData = await res.json();

      if (res.ok && responseData.success) {
        toast.success(accountData?.hasPassword ? "Password changed successfully" : "Password set successfully", {
          description: accountData?.hasPassword ? "Your password has been updated." : "You can now log in with your email and password.",
        });
        resetPasswordForm();
        // Reload account data to update hasPassword status
        window.location.reload();
      } else {
        toast.error(accountData?.hasPassword ? "Password change failed" : "Password set failed", {
          description: responseData.message || "Please check your input.",
        });
      }
    } catch (error) {
      console.error("Change password error", error);
      toast.error("Password change failed", {
        description: "An error occurred. Please try again.",
      });
    }
  };

  if (loading) {
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
                    <p className="mt-2 text-gray-400">
                      Manage your admin account information
                    </p>
                  </div>
                </div>

                {/* Main Content */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Left Column - Edit Forms */}
                  <div className="lg:col-span-2 space-y-6">
                    {/* Account Information Card */}
                    <Card className="bg-gray-900 border-gray-800">
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <User className="h-5 w-5" />
                          Account Information
                        </CardTitle>
                        <CardDescription>
                          Update your account details
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <form onSubmit={handleAccountSubmit(handleAccountUpdate)} className="space-y-6">
                          {/* Email (Read-only) */}
                          <div className="space-y-2">
                            <Label htmlFor="email" className="flex items-center gap-2">
                              <Mail className="h-4 w-4" />
                              Email Address
                            </Label>
                            <Input
                              id="email"
                              type="email"
                              value={accountData?.email || ""}
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
                            <Label htmlFor="name" className="flex items-center gap-2">
                              <User className="h-4 w-4" />
                              Display Name <span className="text-red-400">*</span>
                            </Label>
                            <Input
                              id="name"
                              type="text"
                              placeholder="Enter your display name"
                              {...registerAccount("name")}
                              className={`bg-gray-800 text-gray-100 border-gray-700 ${
                                accountErrors.name ? "border-red-500" : ""
                              }`}
                            />
                            {accountErrors.name && (
                              <p className="text-xs text-red-500">{accountErrors.name.message}</p>
                            )}
                            <p className="text-xs text-gray-500">
                              This name will be displayed in the admin panel
                            </p>
                          </div>

                          <Separator className="bg-gray-700" />

                          {/* Phone */}
                          <div className="space-y-2">
                            <Label htmlFor="phone" className="flex items-center gap-2">
                              <Mail className="h-4 w-4" />
                              Phone Number
                            </Label>
                            <Controller
                              name="phone"
                              control={accountControl}
                              render={({ field }) => (
                                <PhoneInput
                                  id="phone"
                                  value={field.value || ""}
                                  onChange={field.onChange}
                                  onBlur={field.onBlur}
                                  showLabel={false}
                                  error={accountErrors.phone?.message}
                                  className={`bg-gray-800 text-gray-100 border-gray-700 ${
                                    accountErrors.phone ? "border-red-500" : ""
                                  }`}
                                />
                              )}
                            />
                            {accountErrors.phone && (
                              <p className="text-xs text-red-500">{accountErrors.phone.message}</p>
                            )}
                            <p className="text-xs text-gray-500">
                              Your contact phone number (Indonesia format)
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
                              disabled={isSavingAccount}
                              className="bg-primary hover:bg-primary/90"
                            >
                              {isSavingAccount ? (
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
                          {accountData?.hasPassword ? 'Change Password' : 'Set Password'}
                        </CardTitle>
                        <CardDescription>
                          {accountData?.hasPassword 
                            ? 'Update your account password (no current password required)'
                            : 'Set a password for your account (signed up with Google)'}
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <form onSubmit={handlePasswordSubmit(handlePasswordChange)} className="space-y-6">
                          {/* New Password */}
                          <div className="space-y-2">
                            <Label htmlFor="newPassword" className="flex items-center gap-2">
                              <Lock className="h-4 w-4" />
                              New Password <span className="text-red-400">*</span>
                            </Label>
                            <div className="relative">
                              <Input
                                id="newPassword"
                                type={showPasswords.new ? "text" : "password"}
                                placeholder="Enter your new password"
                                {...registerPassword("newPassword")}
                                className={`bg-gray-800 text-gray-100 border-gray-700 pr-10 ${
                                  passwordErrors.newPassword ? "border-red-500" : ""
                                }`}
                              />
                              <button
                                type="button"
                                onClick={() =>
                                  setShowPasswords({
                                    ...showPasswords,
                                    new: !showPasswords.new,
                                  })
                                }
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-300"
                              >
                                {showPasswords.new ? (
                                  <EyeOff className="h-4 w-4" />
                                ) : (
                                  <Eye className="h-4 w-4" />
                                )}
                              </button>
                            </div>
                            {passwordErrors.newPassword && (
                              <p className="text-xs text-red-500">{passwordErrors.newPassword.message}</p>
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
                                onClick={() =>
                                  setShowPasswords({
                                    ...showPasswords,
                                    confirm: !showPasswords.confirm,
                                  })
                                }
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
                              disabled={isChangingPassword}
                              className="bg-primary hover:bg-primary/90"
                            >
                              {isChangingPassword ? (
                                <>
                                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                  {accountData?.hasPassword ? 'Changing...' : 'Setting...'}
                                </>
                              ) : (
                                <>
                                  <Lock className="mr-2 h-4 w-4" />
                                  {accountData?.hasPassword ? 'Change Password' : 'Set Password'}
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
                          <p className="text-xs text-gray-500 mb-1">User ID</p>
                          <p className="text-sm font-mono text-gray-300">
                            {accountData?.id || "-"}
                          </p>
                        </div>
                        <Separator className="bg-gray-700" />
                        <div>
                          <p className="text-xs text-gray-500 mb-1">Email</p>
                          <p className="text-sm text-gray-300">
                            {accountData?.email || "-"}
                          </p>
                        </div>
                        <Separator className="bg-gray-700" />
                        <div>
                          <p className="text-xs text-gray-500 mb-1">Display Name</p>
                          <p className="text-sm text-gray-300">
                            {accountData?.name || "Not set"}
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
