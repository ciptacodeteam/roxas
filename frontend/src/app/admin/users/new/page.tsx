"use client";

import { useState, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
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
import { PhoneInputWithCountry } from "@/components/ui/phone-input-with-country";
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
import { 
  useCreateStaffUser, 
  useCreateCustomerUser,
  createUserSchema,
  type CreateUserRequest 
} from "@/lib/users";

export default function UserAddPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const userType = useMemo(() => 
    (searchParams?.get("type") || "customer") as "staff" | "customer",
    [searchParams]
  );

  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState<{
    email: string;
    password: string;
    full_name: string;
    contact_phone: string;
    role: "STAFF" | "CUSTOMER";
  }>(() => ({
    email: "",
    password: "",
    full_name: "",
    contact_phone: "",
    role: (searchParams?.get("type") === "staff" ? "STAFF" : "CUSTOMER") as "STAFF" | "CUSTOMER",
  }));

  const createStaffMutation = useCreateStaffUser({
    onSuccess: () => {
      toast.success("Staff user created successfully");
      router.push("/admin/users");
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Failed to create staff user");
      setSaving(false);
    },
  });

  const createCustomerMutation = useCreateCustomerUser({
    onSuccess: () => {
      toast.success("Customer created successfully");
      router.push("/admin/users");
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Failed to create customer");
      setSaving(false);
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.email || !formData.password) {
      toast.error("Email and password are required");
      return;
    }

    // Validate with Zod schema
    const validationResult = createUserSchema.safeParse(formData);
    if (!validationResult.success) {
      const firstError = validationResult.error.issues[0];
      toast.error(firstError?.message || "Validation failed");
      return;
    }

    // Prepare data for submission
    const submitData: CreateUserRequest = {
      email: formData.email,
      password: formData.password,
      full_name: formData.full_name,
      contact_phone: formData.contact_phone || undefined,
      role: userType === "staff" ? "STAFF" : "CUSTOMER",
    };

    setSaving(true);
    
    if (userType === "staff") {
      createStaffMutation.mutate(submitData);
    } else {
      createCustomerMutation.mutate(submitData);
    }
  };

  const handlePhoneChange = (value: string) => {
    setFormData(prev => ({
      ...prev,
      contact_phone: value,
    }));
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
                      <h1 className="text-3xl font-bold">
                        Add {userType === "staff" ? "Staff User" : "Customer"}
                      </h1>
                      <p className="mt-2 text-gray-400">
                        Create a new {userType} account
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
                        Fill in the details to create a new {userType} account
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
                              setFormData({ ...formData, full_name: e.target.value })
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
