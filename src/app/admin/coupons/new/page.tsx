"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { Loader2, Save, Ticket, DollarSign, Calendar } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { BackButton } from "@/components/admin/back-button";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useCreateCoupon, queryKeys } from "@/lib/queries";
import { DiscountType } from "@prisma/client";
import { DateTimePicker } from "@/components/ui/date-time-picker";

export default function CouponAddPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    code: "",
    description: "",
    discountType: DiscountType.PERCENTAGE as DiscountType,
    discountValue: 0,
    minPurchase: 0,
    maxDiscount: null as number | null,
    usageLimit: null as number | null,
    userLimit: 1,
    isActive: true,
    startDate: null as string | null,
    endDate: null as string | null,
  });

  const createCouponMutation = useCreateCoupon({
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.coupons.all });
      toast.success("Coupon created successfully");
      router.push("/admin/coupons");
    },
    onError: (error) => {
      toast.error(
        error instanceof Error ? error.message : "Failed to create coupon",
      );
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

    if (
      formData.discountType === DiscountType.PERCENTAGE &&
      formData.discountValue > 100
    ) {
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

    createCouponMutation.mutate(submitData, {
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
                <div className="mb-6">
                  <BackButton href="/admin/coupons" label="Back to Coupons" />
                  <div>
                    <h1 className="text-3xl font-bold">Tambah Coupon</h1>
                    <p className="mt-2 text-gray-400">
                      Create a new discount coupon
                    </p>
                  </div>
                </div>

                {/* Main Content */}
                <div className="max-w-3xl">
                  <Card className="border-gray-800 bg-gray-900">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Ticket className="h-5 w-5" />
                        Coupon Information
                      </CardTitle>
                      <CardDescription>
                        Fill in the details to create a new coupon
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Code */}
                        <div className="space-y-2">
                          <Label
                            htmlFor="code"
                            className="flex items-center gap-2"
                          >
                            <Ticket className="h-4 w-4" />
                            Coupon Code <span className="text-red-400">*</span>
                          </Label>
                          <Input
                            id="code"
                            value={formData.code}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                code: e.target.value.toUpperCase(),
                              })
                            }
                            placeholder="WELCOME10"
                            className="border-gray-700 bg-gray-800 font-mono text-gray-100 placeholder:text-gray-500"
                          />
                          <p className="text-xs text-gray-400">
                            Code will be automatically converted to uppercase
                          </p>
                        </div>

                        {/* Description */}
                        <div className="space-y-2">
                          <Label
                            htmlFor="description"
                            className="flex items-center gap-2"
                          >
                            <Ticket className="h-4 w-4" />
                            Description
                          </Label>
                          <Input
                            id="description"
                            value={formData.description}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                description: e.target.value,
                              })
                            }
                            placeholder="Optional description"
                            className="border-gray-700 bg-gray-800 text-gray-100 placeholder:text-gray-500"
                          />
                        </div>

                        <Separator className="bg-gray-700" />

                        {/* Discount Configuration */}
                        <div className="space-y-4">
                          <h3 className="flex items-center gap-2 text-lg font-semibold">
                            <DollarSign className="h-5 w-5" />
                            Discount Configuration
                          </h3>
                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label htmlFor="discountType">
                                Discount Type{" "}
                                <span className="text-red-400">*</span>
                              </Label>
                              <Select
                                value={formData.discountType}
                                onValueChange={(value) =>
                                  setFormData({
                                    ...formData,
                                    discountType: value as DiscountType,
                                  })
                                }
                              >
                                <SelectTrigger className="border-gray-700 bg-gray-800 text-gray-100">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent className="border-gray-700 bg-gray-800 text-gray-100">
                                  <SelectItem
                                    value={DiscountType.PERCENTAGE}
                                    className="hover:bg-gray-700"
                                  >
                                    Percentage
                                  </SelectItem>
                                  <SelectItem
                                    value={DiscountType.FIXED_AMOUNT}
                                    className="hover:bg-gray-700"
                                  >
                                    Fixed Amount
                                  </SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="discountValue">
                                Discount Value{" "}
                                <span className="text-red-400">*</span>
                              </Label>
                              <Input
                                id="discountValue"
                                type="number"
                                step="0.01"
                                value={formData.discountValue}
                                onChange={(e) =>
                                  setFormData({
                                    ...formData,
                                    discountValue:
                                      parseFloat(e.target.value) || 0,
                                  })
                                }
                                placeholder={
                                  formData.discountType ===
                                  DiscountType.PERCENTAGE
                                    ? "10 (for 10%)"
                                    : "50000"
                                }
                                className="border-gray-700 bg-gray-800 text-gray-100 placeholder:text-gray-500"
                              />
                            </div>
                          </div>
                          {formData.discountType ===
                            DiscountType.PERCENTAGE && (
                            <div className="space-y-2">
                              <Label htmlFor="maxDiscount">
                                Max Discount (Optional)
                              </Label>
                              <Input
                                id="maxDiscount"
                                type="number"
                                value={formData.maxDiscount || ""}
                                onChange={(e) =>
                                  setFormData({
                                    ...formData,
                                    maxDiscount: e.target.value
                                      ? parseFloat(e.target.value)
                                      : null,
                                  })
                                }
                                placeholder="50000"
                                className="border-gray-700 bg-gray-800 text-gray-100 placeholder:text-gray-500"
                              />
                              <p className="text-xs text-gray-400">
                                Maximum discount amount in IDR (e.g., 50000)
                              </p>
                            </div>
                          )}
                        </div>

                        <Separator className="bg-gray-700" />

                        {/* Usage Limits */}
                        <div className="space-y-4">
                          <h3 className="flex items-center gap-2 text-lg font-semibold">
                            <Ticket className="h-5 w-5" />
                            Usage Limits
                          </h3>
                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label htmlFor="minPurchase">
                                Minimum Purchase
                              </Label>
                              <Input
                                id="minPurchase"
                                type="number"
                                value={formData.minPurchase}
                                onChange={(e) =>
                                  setFormData({
                                    ...formData,
                                    minPurchase:
                                      parseFloat(e.target.value) || 0,
                                  })
                                }
                                placeholder="0"
                                className="border-gray-700 bg-gray-800 text-gray-100 placeholder:text-gray-500"
                              />
                              <p className="text-xs text-gray-400">
                                Minimum order amount to use this coupon
                              </p>
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="userLimit">Per User Limit</Label>
                              <Input
                                id="userLimit"
                                type="number"
                                value={formData.userLimit}
                                onChange={(e) =>
                                  setFormData({
                                    ...formData,
                                    userLimit: parseInt(e.target.value) || 1,
                                  })
                                }
                                placeholder="1"
                                className="border-gray-700 bg-gray-800 text-gray-100 placeholder:text-gray-500"
                              />
                              <p className="text-xs text-gray-400">
                                How many times a user can use this coupon
                              </p>
                            </div>
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="usageLimit">
                              Total Usage Limit (Optional)
                            </Label>
                            <Input
                              id="usageLimit"
                              type="number"
                              value={formData.usageLimit || ""}
                              onChange={(e) =>
                                setFormData({
                                  ...formData,
                                  usageLimit: e.target.value
                                    ? parseInt(e.target.value)
                                    : null,
                                })
                              }
                              placeholder="Leave empty for unlimited"
                              className="border-gray-700 bg-gray-800 text-gray-100 placeholder:text-gray-500"
                            />
                            <p className="text-xs text-gray-400">
                              Total number of times this coupon can be used
                              (leave empty for unlimited)
                            </p>
                          </div>
                        </div>

                        <Separator className="bg-gray-700" />

                        {/* Date Range */}
                        <div className="space-y-4">
                          <h3 className="flex items-center gap-2 text-lg font-semibold">
                            <Calendar className="h-5 w-5" />
                            Validity Period (Optional)
                          </h3>
                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label htmlFor="startDate">Start Date</Label>
                              <DateTimePicker
                                value={formData.startDate || undefined}
                                onChange={(value) =>
                                  setFormData({
                                    ...formData,
                                    startDate: value || null,
                                  })
                                }
                                placeholder="Select start date and time"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="endDate">End Date</Label>
                              <DateTimePicker
                                value={formData.endDate || undefined}
                                onChange={(value) =>
                                  setFormData({
                                    ...formData,
                                    endDate: value || null,
                                  })
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
                              setFormData({
                                ...formData,
                                isActive: checked === true,
                              })
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
                                Create Coupon
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
