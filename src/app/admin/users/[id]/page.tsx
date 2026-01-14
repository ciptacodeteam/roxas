"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { ArrowLeft, Loader2, Save, User, Mail, Phone, Shield, Calendar, ShoppingCart, DollarSign, CheckCircle2, XCircle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AppSidebar } from "@/components/app-sidebar";
import { AdminHeader } from "@/components/admin-header";
import {
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar";
import { toast } from "sonner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { useAdminUser, useUpdateUser } from "@/lib/queries";

interface UserDetail {
  id: string;
  email: string;
  name: string | null;
  image: string | null;
  emailVerified: boolean;
  phone: string | null;
  role: string;
  createdAt: string;
  updatedAt: string;
  _count: {
    orders: number;
    accounts: number;
    sessions: number;
    couponUsages: number;
  };
  orders: Array<{
    id: string;
    orderNumber: string;
    status: string;
    totalAmount: number;
    createdAt: string;
    productItem: {
      name: string;
      product: {
        name: string;
      };
    };
  }>;
  stats: {
    totalSpent: number;
    completedOrders: number;
  };
}

export default function UserEditPage() {
  const router = useRouter();
  const params = useParams();
  const userId = params?.id as string;

  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    name: "",
    phone: "",
    role: "USER",
    emailVerified: false,
    password: "",
  });

  // Use React Query to fetch user data
  const { data: userData, isLoading: loading, error } = useAdminUser(userId);
  const typedUserData = userData as UserDetail | null | undefined;

  // Update form data when user data changes
  useEffect(() => {
    if (typedUserData) {
      setFormData({
        email: typedUserData.email,
        name: typedUserData.name || "",
        phone: typedUserData.phone || "",
        role: typedUserData.role,
        emailVerified: typedUserData.emailVerified,
        password: "", // Don't pre-fill password
      });
    }
  }, [typedUserData]);

  const updateUserMutation = useUpdateUser({
    onSuccess: () => {
      toast.success("User updated successfully");
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Failed to update user");
      setSaving(false);
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    // Don't send password if it's empty
    const submitData = formData.password
      ? { ...formData }
      : (({ password, ...rest }) => rest)(formData);

    updateUserMutation.mutate(
      { id: userId, data: submitData },
      {
        onSettled: () => {
          setSaving(false);
        },
      }
    );
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
      PENDING: { label: "Pending", variant: "outline" },
      PAID: { label: "Paid", variant: "default" },
      PROCESSING: { label: "Processing", variant: "default" },
      COMPLETED: { label: "Completed", variant: "default" },
      FAILED: { label: "Failed", variant: "destructive" },
      REFUNDED: { label: "Refunded", variant: "secondary" },
      EXPIRED: { label: "Expired", variant: "destructive" },
    };

    const config = statusConfig[status] || { label: status, variant: "outline" };
    return <Badge variant={config.variant}>{config.label}</Badge>;
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
              <div className="flex items-center justify-center min-h-[400px]">
                <Loader2 className="h-8 w-8 animate-spin text-rose-500" />
              </div>
            </div>
          </div>
        </SidebarInset>
      </SidebarProvider>
    );
  }

  if (error || !typedUserData) {
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
              <div className="flex items-center justify-center min-h-[400px]">
                <div className="text-center">
                  <p className="text-red-400 mb-4">
                    {error ? "Failed to load user data" : "User not found"}
                  </p>
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
                    <h1 className="text-3xl font-bold">Edit User</h1>
                    <p className="mt-2 text-gray-400">
                      Manage user account information and view related data
                    </p>
                  </div>
                </div>
              </div>

              {/* Main Content - Two Column Layout */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left Column - Edit Form */}
                <div className="lg:col-span-2">
                  <Card className="bg-gray-900 border-gray-800">
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
                        {/* Email */}
                        <div className="space-y-2">
                          <Label htmlFor="email" className="flex items-center gap-2">
                            <Mail className="h-4 w-4" />
                            Email Address
                          </Label>
                          <Input
                            id="email"
                            type="email"
                            value={formData.email}
                            onChange={(e) =>
                              setFormData({ ...formData, email: e.target.value })
                            }
                            required
                            className="bg-gray-800 text-gray-100 border-gray-700"
                          />
                        </div>

                        {/* Name */}
                        <div className="space-y-2">
                          <Label htmlFor="name" className="flex items-center gap-2">
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
                            className="bg-gray-800 text-gray-100 border-gray-700"
                          />
                        </div>

                        {/* Phone */}
                        <div className="space-y-2">
                          <Label htmlFor="phone" className="flex items-center gap-2">
                            <Phone className="h-4 w-4" />
                            Phone Number
                          </Label>
                          <Input
                            id="phone"
                            type="tel"
                            value={formData.phone}
                            onChange={(e) =>
                              setFormData({ ...formData, phone: e.target.value })
                            }
                            className="bg-gray-800 text-gray-100 border-gray-700"
                          />
                        </div>

                        {/* Role */}
                        <div className="space-y-2">
                          <Label htmlFor="role" className="flex items-center gap-2">
                            <Shield className="h-4 w-4" />
                            Role
                          </Label>
                          <Select
                            value={formData.role}
                            onValueChange={(value) =>
                              setFormData({ ...formData, role: value })
                            }
                          >
                            <SelectTrigger className="bg-gray-800 text-gray-100 border-gray-700">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="bg-gray-800 text-gray-100 border-gray-700">
                              <SelectItem value="USER">User</SelectItem>
                              <SelectItem value="ADMIN">Admin</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        {/* Password */}
                        <div className="space-y-2">
                          <Label htmlFor="password">Password</Label>
                          <Input
                            id="password"
                            type="password"
                            value={formData.password}
                            onChange={(e) =>
                              setFormData({ ...formData, password: e.target.value })
                            }
                            placeholder="Leave empty to keep current password"
                            className="bg-gray-800 text-gray-100 border-gray-700"
                          />
                          <p className="text-xs text-gray-400">
                            Leave empty to keep the current password
                          </p>
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
                          <Label htmlFor="emailVerified" className="cursor-pointer">
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
                </div>

                {/* Right Column - Related Information */}
                <div className="space-y-6">
                  {/* Account Stats */}
                  <Card className="bg-gray-900 border-gray-800">
                    <CardHeader>
                      <CardTitle>Account Statistics</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-gray-400">
                          <ShoppingCart className="h-4 w-4" />
                          <span>Total Orders</span>
                        </div>
                        <span className="font-semibold">{typedUserData._count.orders}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-gray-400">
                          <DollarSign className="h-4 w-4" />
                          <span>Total Spent</span>
                        </div>
                        <span className="font-semibold">
                          Rp {typedUserData.stats.totalSpent.toLocaleString("id-ID")}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-gray-400">
                          <CheckCircle2 className="h-4 w-4" />
                          <span>Completed Orders</span>
                        </div>
                        <span className="font-semibold">{typedUserData.stats.completedOrders}</span>
                      </div>
                      <Separator className="bg-gray-700" />
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-gray-400">
                          <User className="h-4 w-4" />
                          <span>OAuth Accounts</span>
                        </div>
                        <span className="font-semibold">{typedUserData._count.accounts}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-gray-400">
                          <User className="h-4 w-4" />
                          <span>Active Sessions</span>
                        </div>
                        <span className="font-semibold">{typedUserData._count.sessions}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-gray-400">
                          <User className="h-4 w-4" />
                          <span>Coupons Used</span>
                        </div>
                        <span className="font-semibold">{typedUserData._count.couponUsages}</span>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Account Details */}
                  <Card className="bg-gray-900 border-gray-800">
                    <CardHeader>
                      <CardTitle>Account Details</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <div className="flex items-center gap-2 text-gray-400 mb-1">
                          <Calendar className="h-4 w-4" />
                          <span className="text-sm">Created At</span>
                        </div>
                        <p className="text-sm">
                          {new Date(typedUserData.createdAt).toLocaleDateString("id-ID", {
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </p>
                      </div>
                      <div>
                        <div className="flex items-center gap-2 text-gray-400 mb-1">
                          <Calendar className="h-4 w-4" />
                          <span className="text-sm">Last Updated</span>
                        </div>
                        <p className="text-sm">
                          {new Date(typedUserData.updatedAt).toLocaleDateString("id-ID", {
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </p>
                      </div>
                      <Separator className="bg-gray-700" />
                      <div>
                        <div className="flex items-center gap-2 text-gray-400 mb-1">
                          <Mail className="h-4 w-4" />
                          <span className="text-sm">Email Status</span>
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          {typedUserData.emailVerified ? (
                            <>
                              <CheckCircle2 className="h-4 w-4 text-green-400" />
                              <span className="text-sm text-green-400">Verified</span>
                            </>
                          ) : (
                            <>
                              <XCircle className="h-4 w-4 text-yellow-400" />
                              <span className="text-sm text-yellow-400">Not Verified</span>
                            </>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Recent Orders */}
                  {typedUserData.orders.length > 0 && (
                    <Card className="bg-gray-900 border-gray-800">
                      <CardHeader>
                        <CardTitle>Recent Orders</CardTitle>
                        <CardDescription>
                          Last 5 orders
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          {typedUserData.orders.map((order) => (
                            <div
                              key={order.id}
                              className="p-3 rounded-lg bg-gray-800 border border-gray-700"
                            >
                              <div className="flex items-start justify-between mb-2">
                                <div>
                                  <p className="font-medium text-sm">{order.orderNumber}</p>
                                  <p className="text-xs text-gray-400">
                                    {order.productItem.product.name} - {order.productItem.name}
                                  </p>
                                </div>
                                {getStatusBadge(order.status)}
                              </div>
                              <div className="flex items-center justify-between mt-2">
                                <span className="text-xs text-gray-400">
                                  {new Date(order.createdAt).toLocaleDateString("id-ID")}
                                </span>
                                <span className="text-sm font-semibold">
                                  Rp {order.totalAmount.toLocaleString("id-ID")}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                        {typedUserData._count.orders > 5 && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="w-full mt-4"
                            onClick={() => router.push(`/admin/orders?userId=${userId}`)}
                          >
                            View All Orders ({typedUserData._count.orders})
                          </Button>
                        )}
                      </CardContent>
                    </Card>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}

