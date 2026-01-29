"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams, useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  Loader2,
  Save,
  User,
  Mail,
  Phone,
  Shield,
  Calendar,
  CheckCircle2,
  XCircle,
  Send,
  Key,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { PhoneInputWithCountry } from "@/components/ui/phone-input-with-country";
import { AppSidebar } from "@/components/app-sidebar";
import { AdminHeader } from "@/components/admin-header";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { toast } from "sonner";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import {
  useStaffUser,
  useCustomerUser,
  useUpdateStaffUser,
  useUpdateCustomerUser,
  useSendEmailVerification,
  useSendPasswordReset,
  updateUserSchema,
  type StaffUser,
  type CustomerUser,
} from "@/lib/users";

export default function UserEditPage() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const userId = params?.id as string;
  const userType = (searchParams.get("type") || "customer") as "staff" | "customer";

  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    full_name: "",
    contact_phone: "",
  });

  // Fetch user data based on type
  const { data: staffData, isLoading: staffLoading } = useStaffUser(
    parseInt(userId),
    { enabled: userType === "staff" }
  );
  const { data: customerData, isLoading: customerLoading } = useCustomerUser(
    parseInt(userId),
    { enabled: userType === "customer" }
  );

  const userData = userType === "staff" ? staffData : customerData;
  const loading = userType === "staff" ? staffLoading : customerLoading;

  // Update mutations
  const updateStaffMutation = useUpdateStaffUser({
    onSuccess: () => {
      toast.success("Staff user updated successfully");
      router.push("/admin/users");
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Failed to update staff user");
      setSaving(false);
    },
  });

  const updateCustomerMutation = useUpdateCustomerUser({
    onSuccess: () => {
      toast.success("Customer updated successfully");
      router.push("/admin/users");
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Failed to update customer");
      setSaving(false);
    },
  });

  // Email verification mutation
  const sendVerificationMutation = useSendEmailVerification({
    onSuccess: () => {
      toast.success("Verification email sent successfully");
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Failed to send verification email");
    },
  });

  // Password reset mutation
  const sendPasswordResetMutation = useSendPasswordReset({
    onSuccess: () => {
      toast.success("Password reset email sent successfully");
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Failed to send password reset email");
    },
  });

  // Update form data when user data changes
  useEffect(() => {
    if (userData) {
      setFormData({
        full_name: userData.full_name || "",
        contact_phone: userData.contact_phone || "",
      });
    }
  }, [userData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate with Zod schema
    const validationResult = updateUserSchema.safeParse(formData);
    if (!validationResult.success) {
      const firstError = validationResult.error.issues[0];
      toast.error(firstError?.message || "Validation failed");
      return;
    }

    setSaving(true);

    if (userType === "staff") {
      updateStaffMutation.mutate({
        id: parseInt(userId),
        data: formData,
      });
    } else {
      updateCustomerMutation.mutate({
        id: parseInt(userId),
        data: formData,
      });
    }
  };

  const handlePhoneChange = (value: string) => {
    setFormData(prev => ({
      ...prev,
      contact_phone: value,
    }));
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
              <div className="flex min-h-[400px] items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-rose-500" />
              </div>
            </div>
          </div>
        </SidebarInset>
      </SidebarProvider>
    );
  }

  if (!userData) {
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
              <div className="flex min-h-[400px] items-center justify-center">
                <div className="text-center">
                  <p className="mb-4 text-red-400">User not found</p>
                  <Button onClick={() => router.push("/admin/users")}>
                    Back to Users
                  </Button>
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
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => router.push("/admin/users")}
                    className="mb-4"
                  >
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back to Users
                  </Button>
                  <div>
                    <h1 className="text-3xl font-bold">
                      Edit {userType === "staff" ? "Staff User" : "Customer"}
                    </h1>
                    <p className="mt-2 text-gray-400">
                      Update {userType} account information
                    </p>
                  </div>
                </div>

                {/* Main Content */}
                <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                  {/* Left Column - Edit Form */}
                  <div className="lg:col-span-2">
                    <Card className="border-gray-800 bg-gray-900">
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <User className="h-5 w-5" />
                          User Information
                        </CardTitle>
                        <CardDescription>
                          Update user account details
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <form onSubmit={handleSubmit} className="space-y-6">
                          {/* Email (Read-only) */}
                          <div className="space-y-2">
                            <Label
                              htmlFor="email"
                              className="flex items-center gap-2"
                            >
                              <Mail className="h-4 w-4" />
                              Email Address
                            </Label>
                            <Input
                              id="email"
                              type="email"
                              value={userData.user_data.email}
                              disabled
                              className="border-gray-700 bg-gray-800 text-gray-100 opacity-60"
                            />
                            <p className="text-xs text-gray-400">
                              Email cannot be changed
                            </p>
                          </div>

                          {/* Full Name */}
                          <div className="space-y-2">
                            <Label
                              htmlFor="full_name"
                              className="flex items-center gap-2"
                            >
                              <User className="h-4 w-4" />
                              Full Name
                            </Label>
                            <Input
                              id="full_name"
                              type="text"
                              value={formData.full_name}
                              onChange={(e) =>
                                setFormData({
                                  ...formData,
                                  full_name: e.target.value,
                                })
                              }
                              placeholder="Full name"
                              className="border-gray-700 bg-gray-800 text-gray-100 placeholder:text-gray-500"
                            />
                          </div>

                          {/* Phone */}
                          <div className="space-y-2">
                            <Label
                              htmlFor="contact_phone"
                              className="flex items-center gap-2"
                            >
                              <Phone className="h-4 w-4" />
                              Phone Number
                            </Label>
                            <PhoneInputWithCountry
                              value={formData.contact_phone}
                              onChange={handlePhoneChange}
                              placeholder="Enter phone number"
                            />
                          </div>

                          <Separator className="bg-gray-700" />

                          {/* Submit Button */}
                          <div className="flex justify-end gap-3">
                            <Button
                              type="button"
                              variant="outline"
                              onClick={() => router.push("/admin/users")}
                              disabled={saving}
                            >
                              Cancel
                            </Button>
                            <Button type="submit" disabled={saving}>
                              {saving ? (
                                <>
                                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                  Updating...
                                </>
                              ) : (
                                <>
                                  <Save className="mr-2 h-4 w-4" />
                                  Update User
                                </>
                              )}
                            </Button>
                          </div>
                        </form>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Right Column - User Stats */}
                  <div className="space-y-6">
                    <Card className="border-gray-800 bg-gray-900">
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-lg">
                          <Shield className="h-5 w-5" />
                          Account Status
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-400">Role</span>
                          <Badge variant="outline">
                            {userData.user_data.role}
                          </Badge>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-400">Status</span>
                          {userData.user_data.is_active ? (
                            <Badge className="bg-green-600/20 text-green-400">
                              <CheckCircle2 className="mr-1 h-3 w-3" />
                              Active
                            </Badge>
                          ) : (
                            <Badge variant="destructive">
                              <XCircle className="mr-1 h-3 w-3" />
                              Inactive
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-400">Email Verified</span>
                          {userData.user_data.email_verified ? (
                            <Badge className="bg-green-600/20 text-green-400">
                              <CheckCircle2 className="mr-1 h-3 w-3" />
                              Verified
                            </Badge>
                          ) : (
                            <Badge variant="outline">
                              <XCircle className="mr-1 h-3 w-3" />
                              Not Verified
                            </Badge>
                          )}
                        </div>
                        {userData.user_data.is_staff && (
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-400">Staff Access</span>
                            <Badge className="bg-blue-600/20 text-blue-400">
                              <CheckCircle2 className="mr-1 h-3 w-3" />
                              Enabled
                            </Badge>
                          </div>
                        )}
                        {userData.user_data.is_superuser && (
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-400">Superuser</span>
                            <Badge className="bg-purple-600/20 text-purple-400">
                              <CheckCircle2 className="mr-1 h-3 w-3" />
                              Yes
                            </Badge>
                          </div>
                        )}
                        <Separator className="bg-gray-700" />
                        <div className="space-y-2">
                          <div className="flex items-center gap-2 text-sm">
                            <Calendar className="h-4 w-4 text-gray-400" />
                            <span className="text-gray-400">Joined:</span>
                          </div>
                          <p className="text-sm">
                            {new Date(userData.user_data.date_joined).toLocaleDateString()}
                          </p>
                        </div>
                        {userData.user_data.last_login && (
                          <div className="space-y-2">
                            <div className="flex items-center gap-2 text-sm">
                              <Calendar className="h-4 w-4 text-gray-400" />
                              <span className="text-gray-400">Last Login:</span>
                            </div>
                            <p className="text-sm">
                              {new Date(userData.user_data.last_login).toLocaleString()}
                            </p>
                          </div>
                        )}
                        {userData.user_data.email_verified_at && (
                          <div className="space-y-2">
                            <div className="flex items-center gap-2 text-sm">
                              <Calendar className="h-4 w-4 text-gray-400" />
                              <span className="text-gray-400">Email Verified:</span>
                            </div>
                            <p className="text-sm">
                              {new Date(userData.user_data.email_verified_at).toLocaleString()}
                            </p>
                          </div>
                        )}
                      </CardContent>
                    </Card>

                    {/* Email Verification Card */}
                    <Card className="border-gray-800 bg-gray-900">
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-lg">
                          <Mail className="h-5 w-5" />
                          Email Verification
                        </CardTitle>
                        <CardDescription>
                          Send verification email to user
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <Button
                          onClick={() => sendVerificationMutation.mutate(userData.user_data.id)}
                          disabled={userData.user_data.email_verified || sendVerificationMutation.isPending}
                          className="w-full"
                          variant={userData.user_data.email_verified ? "outline" : "default"}
                        >
                          {sendVerificationMutation.isPending ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Sending...
                            </>
                          ) : (
                            <>
                              <Send className="mr-2 h-4 w-4" />
                              {userData.user_data.email_verified ? "Already Verified" : "Send Verification"}
                            </>
                          )}
                        </Button>
                      </CardContent>
                    </Card>

                    {/* Password Reset Card */}
                    <Card className="border-gray-800 bg-gray-900">
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-lg">
                          <Key className="h-5 w-5" />
                          Password Reset
                        </CardTitle>
                        <CardDescription>
                          Send password reset email to user
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <Button
                          onClick={() => sendPasswordResetMutation.mutate(userData.user_data.id)}
                          disabled={sendPasswordResetMutation.isPending}
                          className="w-full"
                          variant="outline"
                        >
                          {sendPasswordResetMutation.isPending ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Sending...
                            </>
                          ) : (
                            <>
                              <Send className="mr-2 h-4 w-4" />
                              Send Reset Email
                            </>
                          )}
                        </Button>
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
