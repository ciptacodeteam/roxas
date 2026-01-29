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
import { useCoupon, useUpdateCoupon, DiscountType, type Coupon } from "@/lib/coupons";
import { formatDateTime, utcToLocal, localToUTC } from "@/lib/date-utils";
import { DateTimePicker } from "@/components/ui/date-time-picker";

export default function CouponEditPage() {
  const router = useRouter();
  const params = useParams();
  const couponId = params?.id as string;

  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState<{
    code: string;
    description: string;
    discount_type: DiscountType;
    discount_value: number;
    min_purchase: number | null;
    max_discount: number | null;
    usage_limit: number | null;
    user_limit: number | null;
    is_active: boolean;
    start_date: string | null;
    end_date: string | null;
  }>({
    code: "",
    description: "",
    discount_type: DiscountType.PERCENTAGE,
    discount_value: 0,
    min_purchase: null,
    max_discount: null,
    usage_limit: null,
    user_limit: null,
    is_active: true,
    start_date: null,
    end_date: null,
  });

  // Use React Query to fetch coupon data
  const { data: couponData, isLoading: loading, error } = useCoupon(couponId, {
    refetchOnMount: 'always',
    refetchOnWindowFocus: true,
    staleTime: 0,
  });
  const typedCouponData = couponData as Coupon | null | undefined;

  // Update form data when coupon data changes
  useEffect(() => {
    if (typedCouponData) {
      // Ensure discount_type is a string to match SelectItem values exactly
      const discountTypeValue = typedCouponData.discount_type ? String(typedCouponData.discount_type) : DiscountType.PERCENTAGE;

      setFormData({
        code: typedCouponData.code,
        description: typedCouponData.description || "",
        discount_type: discountTypeValue as DiscountType,
        discount_value: typedCouponData.discount_value,
        min_purchase: typedCouponData.min_purchase,
        max_discount: typedCouponData.max_discount,
        usage_limit: typedCouponData.usage_limit,
        user_limit: typedCouponData.user_limit,
        is_active: typedCouponData.is_active,
        start_date: typedCouponData.start_date ? utcToLocal(typedCouponData.start_date) : null,
        end_date: typedCouponData.end_date ? utcToLocal(typedCouponData.end_date) : null,
      });
    }
  }, [typedCouponData]);

  const updateCouponMutation = useUpdateCoupon({
    onSuccess: () => {
      toast.success("Coupon updated successfully");
      router.push("/admin/coupons");
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Failed to update coupon");
      setSaving(false);
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.code || !formData.discount_type || !formData.discount_value) {
      toast.error("Code, discount type, and discount value are required");
      return;
    }

    if (formData.discount_value <= 0) {
      toast.error("Discount value must be greater than 0");
      return;
    }

    if (formData.discount_type === DiscountType.PERCENTAGE && formData.discount_value > 100) {
      toast.error("Percentage discount cannot exceed 100%");
      return;
    }

    setSaving(true);
    const submitData = {
      ...formData,
      code: formData.code.toUpperCase().trim(),
      description: formData.description || undefined,
      min_purchase: formData.min_purchase || 0,
      max_discount: formData.max_discount || undefined,
      usage_limit: formData.usage_limit || undefined,
      start_date: formData.start_date ? localToUTC(formData.start_date) : undefined,
      end_date: formData.end_date ? localToUTC(formData.end_date) : undefined,
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
                                  value={formData.discount_type || undefined}
                                  onValueChange={(value) => {
                                    if (!value?.trim()) return;
                                    setFormData({
                                      ...formData,
                                      discount_type: value as DiscountType,
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
                                  value={formData.discount_value}
                                  onChange={(e) =>
                                    setFormData({
                                      ...formData,
                                      discount_value: parseFloat(e.target.value) || 0,
                                    })
                                  }
                                  className="bg-gray-800 text-gray-100 border-gray-700"
                                />
                              </div>
                            </div>
                            {formData.discount_type === DiscountType.PERCENTAGE && (
                              <div className="space-y-2">
                                <Label htmlFor="maxDiscount">Max Discount (Optional)</Label>
                                <Input
                                  id="maxDiscount"
                                  type="number"
                                  value={formData.max_discount || ""}
                                  onChange={(e) =>
                                    setFormData({
                                      ...formData,
                                      max_discount: e.target.value ? parseFloat(e.target.value) : null,
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
                                  value={formData.min_purchase || ""}
                                  onChange={(e) =>
                                    setFormData({
                                      ...formData,
                                      min_purchase: e.target.value ? parseFloat(e.target.value) : null,
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
                                  value={formData.user_limit || ""}
                                  onChange={(e) =>
                                    setFormData({
                                      ...formData,
                                      user_limit: e.target.value ? parseInt(e.target.value) : null,
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
                                value={formData.usage_limit || ""}
                                onChange={(e) =>
                                  setFormData({
                                    ...formData,
                                    usage_limit: e.target.value ? parseInt(e.target.value) : null,
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
                                  value={formData.start_date || undefined}
                                  onChange={(value) =>
                                    setFormData({ ...formData, start_date: value || null })
                                  }
                                  placeholder="Select start date and time"
                                />
                              </div>
                              <div className="space-y-2">
                                <Label htmlFor="endDate">End Date</Label>
                                <DateTimePicker
                                  value={formData.end_date || undefined}
                                  onChange={(value) =>
                                    setFormData({ ...formData, end_date: value || null })
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
                              checked={formData.is_active}
                              onCheckedChange={(checked) =>
                                setFormData({ ...formData, is_active: checked === true })
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
                            variant={typedCouponData.is_active ? "default" : "secondary"}
                            className={typedCouponData.is_active ? "bg-green-600/20 text-green-400" : "bg-gray-600/20 text-gray-400"}
                          >
                            {typedCouponData.is_active ? "Active" : "Inactive"}
                          </Badge>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-400">Usage Count</span>
                          <span className="text-sm text-gray-200 font-semibold">
                            {typedCouponData.usage_count}
                            {typedCouponData.usage_limit !== null && ` / ${typedCouponData.usage_limit}`}
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
                            {typedCouponData.discount_type === DiscountType.PERCENTAGE
                              ? `${typedCouponData.discount_value}%`
                              : `Rp ${typedCouponData.discount_value.toLocaleString("id-ID")}`}
                          </p>
                        </div>
                        {typedCouponData.min_purchase !== null && typedCouponData.min_purchase > 0 && (
                          <div>
                            <span className="text-xs text-gray-400">Min Purchase</span>
                            <p className="text-sm text-gray-200">
                              Rp {typedCouponData.min_purchase.toLocaleString("id-ID")}
                            </p>
                          </div>
                        )}
                        {typedCouponData.max_discount !== null && (
                          <div>
                            <span className="text-xs text-gray-400">Max Discount</span>
                            <p className="text-sm text-gray-200">
                              Rp {typedCouponData.max_discount.toLocaleString("id-ID")}
                            </p>
                          </div>
                        )}
                        {typedCouponData.user_limit !== null && (
                          <div>
                            <span className="text-xs text-gray-400">Per User Limit</span>
                            <p className="text-sm text-gray-200">{typedCouponData.user_limit}</p>
                          </div>
                        )}
                      </CardContent>
                    </Card>

                    {/* Validity Period */}
                    {(typedCouponData.start_date || typedCouponData.end_date) && (
                      <Card className="bg-gray-900 border-gray-800">
                        <CardHeader>
                          <CardTitle className="flex items-center gap-2">
                            <Calendar className="h-5 w-5" />
                            Validity Period
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          {typedCouponData.start_date && (
                            <div>
                              <span className="text-xs text-gray-400">Start Date</span>
                              <p className="text-sm text-gray-200">
                                {formatDateTime(typedCouponData.start_date)}
                              </p>
                            </div>
                          )}
                          {typedCouponData.end_date && (
                            <div>
                              <span className="text-xs text-gray-400">End Date</span>
                              <p className="text-sm text-gray-200">
                                {formatDateTime(typedCouponData.end_date)}
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
                                    Order: {usage.order.order_number}
                                  </p>
                                  <p className="text-xs text-gray-400">
                                    {formatDateTime(usage.created_at)}
                                  </p>
                                </div>
                                <div className="text-right">
                                  <p className="text-sm font-semibold text-green-400">
                                    -Rp {usage.discount_amount.toLocaleString("id-ID")}
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
                            {formatDateTime(typedCouponData.created_at)}
                          </p>
                        </div>
                        <div>
                          <span className="text-xs text-gray-400">Updated At</span>
                          <p className="text-sm text-gray-200">
                            {formatDateTime(typedCouponData.updated_at)}
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

