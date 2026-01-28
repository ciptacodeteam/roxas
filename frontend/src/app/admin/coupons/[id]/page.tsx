"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { Loader2, Save, Ticket, DollarSign, Calendar, CheckCircle2, Users } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { BackButton } from "@/components/admin/back-button";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAdminCoupon, useUpdateCoupon } from "@/lib/queries";
import { DiscountType } from "@/lib/types";
import { formatDateTime } from "@/lib/date-utils";
import { DateTimePicker } from "@/components/ui/date-time-picker";

interface CouponDetail {
  id: string;
  code: string;
  description: string | null;
  discountType: DiscountType;
  discountValue: number;
  minPurchase: number | null;
  maxDiscount: number | null;
  usageLimit: number | null;
  usageCount: number;
  userLimit: number | null;
  isActive: boolean;
  startDate: string | null;
  endDate: string | null;
  createdAt: string;
  updatedAt: string;
  _count?: {
    usages: number;
  };
  usages?: Array<{
    id: string;
    userId: string;
    orderId: string;
    discountAmount: number;
    createdAt: string;
    user: {
      id: string;
      email: string;
      name: string | null;
    };
    order: {
      id: string;
      orderNumber: string;
      finalPrice: number;
    };
  }>;
}

export default function CouponEditPage() {
  const router = useRouter();
  const params = useParams();
  const couponId = params?.id as string;

  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState<{
    code: string;
    description: string;
    discountType: DiscountType;
    discountValue: number;
    minPurchase: number | null;
    maxDiscount: number | null;
    usageLimit: number | null;
    userLimit: number | null;
    isActive: boolean;
    startDate: string | null;
    endDate: string | null;
  }>({
    code: "",
    description: "",
    discountType: DiscountType.PERCENTAGE,
    discountValue: 0,
    minPurchase: null,
    maxDiscount: null,
    usageLimit: null,
    userLimit: null,
    isActive: true,
    startDate: null,
    endDate: null,
  });

  // Use React Query to fetch coupon data
  const { data: couponData, isLoading: loading, error } = useAdminCoupon(couponId, {
    refetchOnMount: 'always',
    refetchOnWindowFocus: true,
    staleTime: 0,
  });
  const typedCouponData = couponData as CouponDetail | null | undefined;

  // Update form data when coupon data changes
  useEffect(() => {
    if (typedCouponData) {
      // Ensure discountType is a string to match SelectItem values exactly
      const discountTypeValue = typedCouponData.discountType ? String(typedCouponData.discountType) : DiscountType.PERCENTAGE;

      setFormData({
        code: typedCouponData.code,
        description: typedCouponData.description || "",
        discountType: discountTypeValue as DiscountType,
        discountValue: typedCouponData.discountValue,
        minPurchase: typedCouponData.minPurchase,
        maxDiscount: typedCouponData.maxDiscount,
        usageLimit: typedCouponData.usageLimit,
        userLimit: typedCouponData.userLimit,
        isActive: typedCouponData.isActive,
        startDate: typedCouponData.startDate,
        endDate: typedCouponData.endDate,
      });
    }
  }, [typedCouponData]);

  const updateCouponMutation = useUpdateCoupon({
    onSuccess: async () => {
      toast.success("Coupon updated successfully");
      // Wait a bit for query invalidation to complete before navigating
      await new Promise(resolve => setTimeout(resolve, 100));
      router.push("/admin/coupons");
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Failed to update coupon");
      setSaving(false);
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.code || !formData.discountType || !formData.discountValue) {
      toast.error("Code, discount type, and discount value are required");
      return;
    }

    if (formData.discountValue <= 0) {
      toast.error("Discount value must be greater than 0");
      return;
    }

    if (formData.discountType === DiscountType.PERCENTAGE && formData.discountValue > 100) {
      toast.error("Percentage discount cannot exceed 100%");
      return;
    }

    setSaving(true);
    const submitData = {
      ...formData,
      code: formData.code.toUpperCase().trim(),
      description: formData.description || null,
      minPurchase: formData.minPurchase || 0,
      maxDiscount: formData.maxDiscount || null,
      usageLimit: formData.usageLimit || null,
      startDate: formData.startDate || null,
      endDate: formData.endDate || null,
    };

    updateCouponMutation.mutate(
      { id: couponId, data: submitData },
      {
        onSettled: () => {
          setSaving(false);
        },
      }
    );
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
          <div className="flex flex-1 flex-col items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-rose-500" />
          </div>
        </SidebarInset>
      </SidebarProvider>
    );
  }

  if (error || !typedCouponData) {
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
          <div className="flex flex-1 flex-col items-center justify-center">
            <p className="text-red-400">
              {error instanceof Error ? error.message : "Coupon not found"}
            </p>
            <Button
              onClick={() => router.push("/admin/coupons")}
              className="mt-4"
            >
              Back to Coupons
            </Button>
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
                  <BackButton href="/admin/coupons" label="Back to Coupons" />
                  <div>
                    <h1 className="text-3xl font-bold">Edit Coupon</h1>
                    <p className="mt-2 text-gray-400">
                      Manage coupon information and view usage history
                    </p>
                  </div>
                </div>

                {/* Main Content - Two Column Layout */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Left Column - Edit Form */}
                  <div className="lg:col-span-2">
                    <Card className="bg-gray-900 border-gray-800">
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Ticket className="h-5 w-5" />
                          Coupon Information
                        </CardTitle>
                        <CardDescription>
                          Update coupon details
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <form onSubmit={handleSubmit} className="space-y-6">
                          {/* Code */}
                          <div className="space-y-2">
                            <Label htmlFor="code" className="flex items-center gap-2">
                              <Ticket className="h-4 w-4" />
                              Coupon Code <span className="text-red-400">*</span>
                            </Label>
                            <Input
                              id="code"
                              value={formData.code}
                              onChange={(e) =>
                                setFormData({ ...formData, code: e.target.value.toUpperCase() })
                              }
                              className="bg-gray-800 text-gray-100 border-gray-700 font-mono"
                            />
                          </div>

                          {/* Description */}
                          <div className="space-y-2">
                            <Label htmlFor="description" className="flex items-center gap-2">
                              <Ticket className="h-4 w-4" />
                              Description
                            </Label>
                            <Input
                              id="description"
                              value={formData.description}
                              onChange={(e) =>
                                setFormData({ ...formData, description: e.target.value })
                              }
                              className="bg-gray-800 text-gray-100 border-gray-700"
                            />
                          </div>

                          <Separator className="bg-gray-700" />

                          {/* Discount Configuration */}
                          <div className="space-y-4">
                            <h3 className="text-lg font-semibold flex items-center gap-2">
                              <DollarSign className="h-5 w-5" />
                              Discount Configuration
                            </h3>
                            <div className="grid grid-cols-2 gap-4">
                              <div className="space-y-2">
                                <Label htmlFor="discountType">Discount Type <span className="text-red-400">*</span></Label>
                                <Select
                                  value={formData.discountType || undefined}
                                  onValueChange={(value) => {
                                    if (!value?.trim()) return;
                                    setFormData({
                                      ...formData,
                                      discountType: value as DiscountType,
                                    });
                                  }}
                                >
                                  <SelectTrigger className="bg-gray-800 text-gray-100 border-gray-700">
                                    <SelectValue placeholder="Select discount type" />
                                  </SelectTrigger>
                                  <SelectContent className="bg-gray-800 text-gray-100 border-gray-700">
                                    <SelectItem value={String(DiscountType.PERCENTAGE)} className="hover:bg-gray-700">Percentage</SelectItem>
                                    <SelectItem value={String(DiscountType.FIXED_AMOUNT)} className="hover:bg-gray-700">Fixed Amount</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                              <div className="space-y-2">
                                <Label htmlFor="discountValue">Discount Value <span className="text-red-400">*</span></Label>
                                <Input
                                  id="discountValue"
                                  type="number"
                                  step="0.01"
                                  value={formData.discountValue}
                                  onChange={(e) =>
                                    setFormData({
                                      ...formData,
                                      discountValue: parseFloat(e.target.value) || 0,
                                    })
                                  }
                                  className="bg-gray-800 text-gray-100 border-gray-700"
                                />
                              </div>
                            </div>
                            {formData.discountType === DiscountType.PERCENTAGE && (
                              <div className="space-y-2">
                                <Label htmlFor="maxDiscount">Max Discount (Optional)</Label>
                                <Input
                                  id="maxDiscount"
                                  type="number"
                                  value={formData.maxDiscount || ""}
                                  onChange={(e) =>
                                    setFormData({
                                      ...formData,
                                      maxDiscount: e.target.value ? parseFloat(e.target.value) : null,
                                    })
                                  }
                                  className="bg-gray-800 text-gray-100 border-gray-700"
                                />
                              </div>
                            )}
                          </div>

                          <Separator className="bg-gray-700" />

                          {/* Usage Limits */}
                          <div className="space-y-4">
                            <h3 className="text-lg font-semibold flex items-center gap-2">
                              <Ticket className="h-5 w-5" />
                              Usage Limits
                            </h3>
                            <div className="grid grid-cols-2 gap-4">
                              <div className="space-y-2">
                                <Label htmlFor="minPurchase">Minimum Purchase</Label>
                                <Input
                                  id="minPurchase"
                                  type="number"
                                  value={formData.minPurchase || ""}
                                  onChange={(e) =>
                                    setFormData({
                                      ...formData,
                                      minPurchase: e.target.value ? parseFloat(e.target.value) : null,
                                    })
                                  }
                                  className="bg-gray-800 text-gray-100 border-gray-700"
                                />
                              </div>
                              <div className="space-y-2">
                                <Label htmlFor="userLimit">Per User Limit</Label>
                                <Input
                                  id="userLimit"
                                  type="number"
                                  value={formData.userLimit || ""}
                                  onChange={(e) =>
                                    setFormData({
                                      ...formData,
                                      userLimit: e.target.value ? parseInt(e.target.value) : null,
                                    })
                                  }
                                  className="bg-gray-800 text-gray-100 border-gray-700"
                                />
                              </div>
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="usageLimit">Total Usage Limit (Optional)</Label>
                              <Input
                                id="usageLimit"
                                type="number"
                                value={formData.usageLimit || ""}
                                onChange={(e) =>
                                  setFormData({
                                    ...formData,
                                    usageLimit: e.target.value ? parseInt(e.target.value) : null,
                                  })
                                }
                                className="bg-gray-800 text-gray-100 border-gray-700"
                              />
                            </div>
                          </div>

                          <Separator className="bg-gray-700" />

                          {/* Date Range */}
                          <div className="space-y-4">
                            <h3 className="text-lg font-semibold flex items-center gap-2">
                              <Calendar className="h-5 w-5" />
                              Validity Period (Optional)
                            </h3>
                            <div className="grid grid-cols-2 gap-4">
                              <div className="space-y-2">
                                <Label htmlFor="startDate">Start Date</Label>
                                <DateTimePicker
                                  value={formData.startDate || undefined}
                                  onChange={(value) =>
                                    setFormData({ ...formData, startDate: value || null })
                                  }
                                  placeholder="Select start date and time"
                                />
                              </div>
                              <div className="space-y-2">
                                <Label htmlFor="endDate">End Date</Label>
                                <DateTimePicker
                                  value={formData.endDate || undefined}
                                  onChange={(value) =>
                                    setFormData({ ...formData, endDate: value || null })
                                  }
                                  placeholder="Select end date and time"
                                />
                              </div>
                            </div>
                          </div>

                          {/* Active Status */}
                          <div className="flex items-center space-x-2">
                            <Checkbox
                              id="isActive"
                              checked={formData.isActive}
                              onCheckedChange={(checked) =>
                                setFormData({ ...formData, isActive: checked === true })
                              }
                              className="border-gray-700"
                            />
                            <Label htmlFor="isActive" className="text-gray-200">
                              Active
                            </Label>
                          </div>

                          <Separator className="bg-gray-700" />

                          {/* Submit Button */}
                          <div className="flex justify-end gap-3">
                            <Button
                              type="button"
                              variant="outline"
                              onClick={() => router.push("/admin/coupons")}
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
                                  Update Coupon
                                </>
                              )}
                            </Button>
                          </div>
                        </form>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Right Column - Coupon Details */}
                  <div className="space-y-6">
                    {/* Status */}
                    <Card className="bg-gray-900 border-gray-800">
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <CheckCircle2 className="h-5 w-5" />
                          Status
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-400">Current Status</span>
                          <Badge
                            variant={typedCouponData.isActive ? "default" : "secondary"}
                            className={typedCouponData.isActive ? "bg-green-600/20 text-green-400" : "bg-gray-600/20 text-gray-400"}
                          >
                            {typedCouponData.isActive ? "Active" : "Inactive"}
                          </Badge>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-400">Usage Count</span>
                          <span className="text-sm text-gray-200 font-semibold">
                            {typedCouponData.usageCount}
                            {typedCouponData.usageLimit !== null && ` / ${typedCouponData.usageLimit}`}
                          </span>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Coupon Details */}
                    <Card className="bg-gray-900 border-gray-800">
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Ticket className="h-5 w-5" />
                          Details
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div>
                          <span className="text-xs text-gray-400">Discount</span>
                          <p className="text-sm text-gray-200 font-semibold">
                            {typedCouponData.discountType === DiscountType.PERCENTAGE
                              ? `${typedCouponData.discountValue}%`
                              : `Rp ${typedCouponData.discountValue.toLocaleString("id-ID")}`}
                          </p>
                        </div>
                        {typedCouponData.minPurchase !== null && typedCouponData.minPurchase > 0 && (
                          <div>
                            <span className="text-xs text-gray-400">Min Purchase</span>
                            <p className="text-sm text-gray-200">
                              Rp {typedCouponData.minPurchase.toLocaleString("id-ID")}
                            </p>
                          </div>
                        )}
                        {typedCouponData.maxDiscount !== null && (
                          <div>
                            <span className="text-xs text-gray-400">Max Discount</span>
                            <p className="text-sm text-gray-200">
                              Rp {typedCouponData.maxDiscount.toLocaleString("id-ID")}
                            </p>
                          </div>
                        )}
                        {typedCouponData.userLimit !== null && (
                          <div>
                            <span className="text-xs text-gray-400">Per User Limit</span>
                            <p className="text-sm text-gray-200">{typedCouponData.userLimit}</p>
                          </div>
                        )}
                      </CardContent>
                    </Card>

                    {/* Validity Period */}
                    {(typedCouponData.startDate || typedCouponData.endDate) && (
                      <Card className="bg-gray-900 border-gray-800">
                        <CardHeader>
                          <CardTitle className="flex items-center gap-2">
                            <Calendar className="h-5 w-5" />
                            Validity Period
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          {typedCouponData.startDate && (
                            <div>
                              <span className="text-xs text-gray-400">Start Date</span>
                              <p className="text-sm text-gray-200">
                                {formatDateTime(typedCouponData.startDate)}
                              </p>
                            </div>
                          )}
                          {typedCouponData.endDate && (
                            <div>
                              <span className="text-xs text-gray-400">End Date</span>
                              <p className="text-sm text-gray-200">
                                {formatDateTime(typedCouponData.endDate)}
                              </p>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    )}

                    {/* Usage History */}
                    {typedCouponData.usages && typedCouponData.usages.length > 0 && (
                      <Card className="bg-gray-900 border-gray-800">
                        <CardHeader>
                          <CardTitle className="flex items-center gap-2">
                            <Users className="h-5 w-5" />
                            Recent Usage ({typedCouponData.usages.length})
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                          {typedCouponData.usages.map((usage) => (
                            <div key={usage.id} className="border-b border-gray-800 pb-3 last:border-0">
                              <div className="flex justify-between items-start">
                                <div>
                                  <p className="text-sm font-medium text-gray-200">
                                    {usage.user.name || usage.user.email}
                                  </p>
                                  <p className="text-xs text-gray-400">
                                    Order: {usage.order.orderNumber}
                                  </p>
                                  <p className="text-xs text-gray-400">
                                    {formatDateTime(usage.createdAt)}
                                  </p>
                                </div>
                                <div className="text-right">
                                  <p className="text-sm font-semibold text-green-400">
                                    -Rp {usage.discountAmount.toLocaleString("id-ID")}
                                  </p>
                                </div>
                              </div>
                            </div>
                          ))}
                        </CardContent>
                      </Card>
                    )}

                    {/* Coupon Metadata */}
                    <Card className="bg-gray-900 border-gray-800">
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Calendar className="h-5 w-5" />
                          Metadata
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div>
                          <span className="text-xs text-gray-400">Created At</span>
                          <p className="text-sm text-gray-200">
                            {formatDateTime(typedCouponData.createdAt)}
                          </p>
                        </div>
                        <div>
                          <span className="text-xs text-gray-400">Updated At</span>
                          <p className="text-sm text-gray-200">
                            {formatDateTime(typedCouponData.updatedAt)}
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

