"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { Loader2, Save, CreditCard, DollarSign, Calendar, CheckCircle2, Upload, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import Image from "next/image";
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
import { usePaymentMethod, useUpdatePaymentMethod, PaymentMethodType, FeeType, type PaymentMethod } from "@/lib/payment-methods";
import { formatDateTime } from "@/lib/date-utils";

export default function PaymentMethodEditPage() {
  const router = useRouter();
  const params = useParams();
  const paymentMethodId = params?.id as string;

  const [saving, setSaving] = useState(false);
  const [iconPreview, setIconPreview] = useState<string | null>(null);
  const [iconFile, setIconFile] = useState<File | null>(null);
  const [isFormInitialized, setIsFormInitialized] = useState(false);
  const [formData, setFormData] = useState<{
    type: PaymentMethodType | "";
    name: string;
    description: string;
    fee_type: string;
    fee_value: number;
    vat_type: string;
    vat_value: number;
    is_active: boolean;
    midtrans_code: string;
  }>({
    type: "",
    name: "",
    description: "",
    fee_type: "PERCENTAGE",
    fee_value: 0,
    vat_type: "PERCENTAGE",
    vat_value: 0,
    is_active: true,
    midtrans_code: "",
  });

  // Use React Query to fetch payment method data
  const { data: paymentMethodData, isLoading: loading, error } = usePaymentMethod(
    paymentMethodId,
    {
      refetchOnMount: 'always',
      refetchOnWindowFocus: true,
      staleTime: 0,
    }
  );
  const typedPaymentMethodData = paymentMethodData as PaymentMethod | null | undefined;

  // Update form data when payment method data changes
  useEffect(() => {
    if (typedPaymentMethodData) {
      // Ensure type is a valid PaymentMethodType enum value
      // Convert to string to ensure it matches SelectItem values exactly
      const typeValue = typedPaymentMethodData.type ? String(typedPaymentMethodData.type) as PaymentMethodType : "";

      // Keep fee_type and vat_type as strings for consistent state management
      const feeTypeValue = typedPaymentMethodData.fee_type ? String(typedPaymentMethodData.fee_type) : "PERCENTAGE";
      const vatTypeValue = typedPaymentMethodData.vat_type ? String(typedPaymentMethodData.vat_type) : "PERCENTAGE";

      setFormData({
        type: typeValue,
        name: typedPaymentMethodData.name,
        description: typedPaymentMethodData.description || "",
        fee_type: feeTypeValue,
        fee_value: typedPaymentMethodData.fee_value,
        vat_type: vatTypeValue,
        vat_value: typedPaymentMethodData.vat_value,
        is_active: typedPaymentMethodData.is_active,
        midtrans_code: typedPaymentMethodData.midtrans_code,
      });
      setIconPreview(typedPaymentMethodData.icon || null);
      setIconFile(null);
      if (!isFormInitialized) {
        setIsFormInitialized(true);
      }
    }
  }, [typedPaymentMethodData, isFormInitialized]);

  const updatePaymentMethodMutation = useUpdatePaymentMethod({
    onSuccess: () => {
      toast.success("Payment method updated successfully");
      router.push("/admin/payment-methods");
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Failed to update payment method");
      setSaving(false);
    },
  });

  const handleImageChange = (file: File) => {
    setIconFile(file);
    const reader = new FileReader();
    reader.onloadend = () => {
      setIconPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.type || !formData.name || !formData.midtrans_code) {
      toast.error("Type, name, and Midtrans code are required");
      return;
    }

    setSaving(true);
    const submitData: any = {
      ...formData,
      fee_type: formData.fee_type as FeeType,
      vat_type: formData.vat_type as FeeType,
      description: formData.description || undefined,
    };

    // Add icon file if selected
    if (iconFile) {
      submitData.icon = iconFile;
    }

    updatePaymentMethodMutation.mutate(
      { id: paymentMethodId, data: submitData },
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

  if (error || !typedPaymentMethodData) {
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
              {error instanceof Error ? error.message : "Payment method not found"}
            </p>
            <Button
              onClick={() => router.push("/admin/payment-methods")}
              className="mt-4"
            >
              Back to Payment Methods
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
                  <BackButton href="/admin/payment-methods" label="Back to Payment Methods" />
                  <div>
                    <h1 className="text-3xl font-bold">Edit Payment Method</h1>
                    <p className="mt-2 text-gray-400">
                      Manage payment method information and view related data
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
                          <CreditCard className="h-5 w-5" />
                          Payment Method Information
                        </CardTitle>
                        <CardDescription>
                          Update payment method details
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <form onSubmit={handleSubmit} className="space-y-6">
                          {/* Payment Type */}
                          <div className="space-y-2">
                            <Label htmlFor="type" className="flex items-center gap-2">
                              <CreditCard className="h-4 w-4" />
                              Payment Type <span className="text-red-400">*</span>
                            </Label>
                            <Select
                              value={formData.type ? String(formData.type) : undefined}
                              onValueChange={(value) => {
                                // Prevent empty values from being set
                                if (!value?.trim()) return;
                                setFormData({
                                  ...formData,
                                  type: value as PaymentMethodType,
                                });
                              }}
                            >
                              <SelectTrigger className="bg-gray-800 text-gray-100 border-gray-700">
                                <SelectValue placeholder="Select payment type" />
                              </SelectTrigger>
                              <SelectContent className="bg-gray-800 text-gray-100 border-gray-700">
                                {Object.values(PaymentMethodType).map((type) => (
                                  <SelectItem key={type} value={String(type)} className="hover:bg-gray-700">
                                    {String(type).replace(/_/g, " ")}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>

                          {/* Name */}
                          <div className="space-y-2">
                            <Label htmlFor="name" className="flex items-center gap-2">
                              <CreditCard className="h-4 w-4" />
                              Name <span className="text-red-400">*</span>
                            </Label>
                            <Input
                              id="name"
                              value={formData.name}
                              onChange={(e) =>
                                setFormData({ ...formData, name: e.target.value })
                              }
                              className="bg-gray-800 text-gray-100 border-gray-700"
                            />
                          </div>

                          {/* Midtrans Code */}
                          <div className="space-y-2">
                            <Label htmlFor="midtransCode" className="flex items-center gap-2">
                              <CreditCard className="h-4 w-4" />
                              Midtrans Code <span className="text-red-400">*</span>
                            </Label>
                            <Input
                              id="midtransCode"
                              value={formData.midtrans_code}
                              onChange={(e) =>
                                setFormData({ ...formData, midtrans_code: e.target.value })
                              }
                              className="bg-gray-800 text-gray-100 border-gray-700"
                            />
                          </div>

                          {/* Description */}
                          <div className="space-y-2">
                            <Label htmlFor="description" className="flex items-center gap-2">
                              <CreditCard className="h-4 w-4" />
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

                          {/* Icon Upload */}
                          <div className="space-y-2">
                            <Label htmlFor="icon" className="flex items-center gap-2">
                              <Upload className="h-4 w-4" />
                              Icon
                            </Label>
                            <div className="space-y-2">
                              {iconPreview ? (
                                <div className="relative">
                                  <div className="relative h-24 w-24 overflow-hidden rounded-md border border-gray-700">
                                    <Image
                                      src={iconPreview}
                                      alt="Icon preview"
                                      fill
                                      className="object-contain p-2"
                                    />
                                  </div>
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    className="absolute -right-2 -top-2 h-6 w-6 rounded-full bg-red-500 hover:bg-red-600"
                                    onClick={() => {
                                      setIconPreview(null);
                                      setIconFile(null);
                                    }}
                                  >
                                    <X className="h-3 w-3 text-white" />
                                  </Button>
                                </div>
                              ) : (
                                <div className="flex items-center gap-2">
                                  <Input
                                    id="icon-file"
                                    type="file"
                                    accept="image/*"
                                    onChange={(e) => {
                                      const file = e.target.files?.[0];
                                      if (file) {
                                        handleImageChange(file);
                                      }
                                    }}
                                    className="bg-gray-800 text-gray-100 border-gray-700 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-white hover:file:bg-primary/90 cursor-pointer"
                                  />
                                </div>
                              )}
                            </div>
                          </div>

                          <Separator className="bg-gray-700" />

                          {/* Fee Configuration */}
                          <div className="space-y-4">
                            <h3 className="text-lg font-semibold flex items-center gap-2">
                              <DollarSign className="h-5 w-5" />
                              Fee Configuration
                            </h3>
                            <div className="grid grid-cols-2 gap-4">
                              <div className="space-y-2">
                                <Label htmlFor="feeType">Fee Type</Label>
                                <Select
                                  value={formData.fee_type || "PERCENTAGE"}
                                  onValueChange={(value) => {
                                    if (value) {
                                      setFormData({
                                        ...formData,
                                        fee_type: value,
                                      });
                                    }
                                  }}
                                >
                                  <SelectTrigger className="bg-gray-800 text-gray-100 border-gray-700">
                                    <SelectValue placeholder="Select fee type" />
                                  </SelectTrigger>
                                  <SelectContent className="bg-gray-800 text-gray-100 border-gray-700">
                                    <SelectItem value="PERCENTAGE" className="hover:bg-gray-700">Percentage</SelectItem>
                                    <SelectItem value="FIXED" className="hover:bg-gray-700">Fixed Amount</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                              <div className="space-y-2">
                                <Label htmlFor="feeValue">Fee Value</Label>
                                <Input
                                  id="feeValue"
                                  type="number"
                                  step="0.01"
                                  value={formData.fee_value}
                                  onChange={(e) =>
                                    setFormData({
                                      ...formData,
                                      fee_value: parseFloat(e.target.value) || 0,
                                    })
                                  }
                                  className="bg-gray-800 text-gray-100 border-gray-700"
                                />
                              </div>
                            </div>
                          </div>

                          {/* VAT Configuration */}
                          <div className="space-y-4">
                            <h3 className="text-lg font-semibold flex items-center gap-2">
                              <DollarSign className="h-5 w-5" />
                              VAT Configuration
                            </h3>
                            <div className="grid grid-cols-2 gap-4">
                              <div className="space-y-2">
                                <Label htmlFor="vatType">VAT Type</Label>
                                <Select
                                  value={formData.vat_type || "PERCENTAGE"}
                                  onValueChange={(value) => {
                                    if (value) {
                                      setFormData({
                                        ...formData,
                                        vat_type: value,
                                      });
                                    }
                                  }}
                                >
                                  <SelectTrigger className="bg-gray-800 text-gray-100 border-gray-700">
                                    <SelectValue placeholder="Select VAT type" />
                                  </SelectTrigger>
                                  <SelectContent className="bg-gray-800 text-gray-100 border-gray-700">
                                    <SelectItem value="PERCENTAGE" className="hover:bg-gray-700">Percentage</SelectItem>
                                    <SelectItem value="FIXED" className="hover:bg-gray-700">Fixed Amount</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                              <div className="space-y-2">
                                <Label htmlFor="vatValue">VAT Value</Label>
                                <Input
                                  id="vatValue"
                                  type="number"
                                  step="0.01"
                                  value={formData.vat_value}
                                  onChange={(e) =>
                                    setFormData({
                                      ...formData,
                                      vat_value: parseFloat(e.target.value) || 0,
                                    })
                                  }
                                  className="bg-gray-800 text-gray-100 border-gray-700"
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
                              onClick={() => router.push("/admin/payment-methods")}
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
                                  Update Payment Method
                                </>
                              )}
                            </Button>
                          </div>
                        </form>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Right Column - Payment Method Details */}
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
                            variant={typedPaymentMethodData.is_active ? "default" : "secondary"}
                            className={typedPaymentMethodData.is_active ? "bg-green-600/20 text-green-400" : "bg-gray-600/20 text-gray-400"}
                          >
                            {typedPaymentMethodData.is_active ? "Active" : "Inactive"}
                          </Badge>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Payment Method Details */}
                    <Card className="bg-gray-900 border-gray-800">
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <CreditCard className="h-5 w-5" />
                          Details
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div>
                          <span className="text-xs text-gray-400">Type</span>
                          <p className="text-sm text-gray-200">
                            {typedPaymentMethodData.type.replace(/_/g, " ")}
                          </p>
                        </div>
                        <div>
                          <span className="text-xs text-gray-400">Midtrans Code</span>
                          <p className="text-sm text-gray-200 font-mono">
                            {typedPaymentMethodData.midtrans_code}
                          </p>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Fee & VAT Information */}
                    <Card className="bg-gray-900 border-gray-800">
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <DollarSign className="h-5 w-5" />
                          Fee & VAT
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div>
                          <span className="text-xs text-gray-400">Fee</span>
                          <p className="text-sm text-gray-200 font-semibold">
                            {typedPaymentMethodData.fee_type === FeeType.PERCENTAGE
                              ? `${typedPaymentMethodData.fee_value}%`
                              : `Rp ${typedPaymentMethodData.fee_value.toLocaleString("id-ID")}`}
                          </p>
                        </div>
                        <div>
                          <span className="text-xs text-gray-400">VAT</span>
                          <p className="text-sm text-gray-200 font-semibold">
                            {typedPaymentMethodData.vat_type === FeeType.PERCENTAGE
                              ? `${typedPaymentMethodData.vat_value}%`
                              : `Rp ${typedPaymentMethodData.vat_value.toLocaleString("id-ID")}`}
                          </p>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Payment Method Metadata */}
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
                            {formatDateTime(typedPaymentMethodData.created_at)}
                          </p>
                        </div>
                        <div>
                          <span className="text-xs text-gray-400">Updated At</span>
                          <p className="text-sm text-gray-200">
                            {formatDateTime(typedPaymentMethodData.updated_at)}
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

