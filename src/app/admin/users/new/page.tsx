"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Loader2,
  Save,
  User,
  Mail,
  Phone,
  Shield,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  PhoneInput,
  validateIndonesianPhone,
} from "@/components/ui/phone-input";
import { BackButton } from "@/components/admin/back-button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { useCreateUser, queryKeys } from "@/lib/queries";
import { useQueryClient } from "@tanstack/react-query";

export default function UserAddPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    name: "",
    phone: "",
    role: "USER",
    emailVerified: false,
    password: "",
  });

  const createUserMutation = useCreateUser({
    onSuccess: async () => {
      // Ensure queries are invalidated and refetched
      await queryClient.invalidateQueries({ queryKey: queryKeys.users.all });
      await queryClient.refetchQueries({ queryKey: queryKeys.users.all });
      toast.success("User created successfully");
      router.push("/admin/users");
    },
    onError: (error) => {
      toast.error(
        error instanceof Error ? error.message : "Failed to create user",
      );
      setSaving(false);
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.email || !formData.password) {
      toast.error("Email and password are required");
      return;
    }

    // Validate phone number if provided
    if (formData.phone) {
      const phoneValidation = validateIndonesianPhone(formData.phone);
      if (!phoneValidation.isValid) {
        toast.error(phoneValidation.error || "Invalid phone number");
        return;
      }
    }

    setSaving(true);
    createUserMutation.mutate(formData, {
      onSettled: () => {
        setSaving(false);
      },
    });
  };

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
                <div className="mb-6 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => router.push("/admin/users")}
                    >
                      <ArrowLeft className="mr-2 h-4 w-4" />
                      Back to Users
                    </Button>
                    <div>
                      <h1 className="text-3xl font-bold">Tambah User</h1>
                      <p className="mt-2 text-gray-400">
                        Create a new user account
                      </p>
                    </div>
                  </div>
                </div>

                {/* Main Content */}
                <div className="max-w-2xl">
                  <Card className="border-gray-800 bg-gray-900">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <User className="h-5 w-5" />
                        User Information
                      </CardTitle>
                      <CardDescription>
                        Fill in the details to create a new user account
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Email */}
                        <div className="space-y-2">
                          <Label
                            htmlFor="email"
                            className="flex items-center gap-2"
                          >
                            <Mail className="h-4 w-4" />
                            Email Address{" "}
                            <span className="text-red-400">*</span>
                          </Label>
                          <Input
                            id="email"
                            type="email"
                            value={formData.email}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                email: e.target.value,
                              })
                            }
                            required
                            placeholder="user@example.com"
                            className="border-gray-700 bg-gray-800 text-gray-100 placeholder:text-gray-500"
                          />
                        </div>

                        {/* Name */}
                        <div className="space-y-2">
                          <Label
                            htmlFor="name"
                            className="flex items-center gap-2"
                          >
                            <User className="h-4 w-4" />
                            Full Name
                          </Label>
                          <Input
                            id="name"
                            type="text"
                            value={formData.name}
                            onChange={(e) =>
                              setFormData({ ...formData, name: e.target.value })
                            }
                            placeholder="User name"
                            className="border-gray-700 bg-gray-800 text-gray-100 placeholder:text-gray-500"
                          />
                        </div>

                        {/* Phone */}
                        <div className="space-y-2">
                          <Label
                            htmlFor="phone"
                            className="flex items-center gap-2"
                          >
                            <Phone className="h-4 w-4" />
                            Phone Number
                          </Label>
                          <Input
                            id="phone"
                            type="tel"
                            value={formData.phone}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                phone: e.target.value,
                              })
                            }
                            placeholder="+62..."
                            className="border-gray-700 bg-gray-800 text-gray-100 placeholder:text-gray-500"
                          />
                        </div>

                        {/* Password */}
                        <div className="space-y-2">
                          <Label htmlFor="password">
                            Password <span className="text-red-400">*</span>
                          </Label>
                          <Input
                            id="password"
                            type="password"
                            value={formData.password}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                password: e.target.value,
                              })
                            }
                            required
                            placeholder="Enter password"
                            className="border-gray-700 bg-gray-800 text-gray-100 placeholder:text-gray-500"
                          />
                          <p className="text-xs text-gray-400">
                            Password must be at least 8 characters long
                          </p>
                        </div>

                        {/* Role */}
                        <div className="space-y-2">
                          <Label
                            htmlFor="role"
                            className="flex items-center gap-2"
                          >
                            <Shield className="h-4 w-4" />
                            Role
                          </Label>
                          <Select
                            value={formData.role}
                            onValueChange={(value) =>
                              setFormData({ ...formData, role: value })
                            }
                          >
                            <SelectTrigger className="border-gray-700 bg-gray-800 text-gray-100">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="border-gray-700 bg-gray-800 text-gray-100">
                              <SelectItem value="USER">User</SelectItem>
                              <SelectItem value="ADMIN">Admin</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        {/* Email Verified */}
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id="emailVerified"
                            checked={formData.emailVerified}
                            onCheckedChange={(checked) =>
                              setFormData({
                                ...formData,
                                emailVerified: !!checked,
                              })
                            }
                          />
                          <Label
                            htmlFor="emailVerified"
                            className="cursor-pointer"
                          >
                            Email Verified
                          </Label>
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
                                Creating...
                              </>
                            ) : (
                              <>
                                <Save className="mr-2 h-4 w-4" />
                                Create User
                              </>
                            )}
                          </Button>
                        </div>
                      </form>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
