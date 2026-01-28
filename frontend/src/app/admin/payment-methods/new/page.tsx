"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Save, CreditCard, DollarSign, Upload, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import Image from "next/image";
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
import { useCreatePaymentMethod } from "@/lib/queries";
import { PaymentMethodType, BankTransferBank, FeeType } from "@/lib/types";

export default function PaymentMethodAddPage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [iconPreview, setIconPreview] = useState<string | null>(null);
  const [uploadingIcon, setUploadingIcon] = useState(false);
  const [formData, setFormData] = useState({
    type: "" as PaymentMethodType | "",
    bank: "" as BankTransferBank | "",
    name: "",
    description: "",
    icon: "",
    feeType: FeeType.PERCENTAGE as FeeType,
    feeValue: 0,
    vatType: FeeType.PERCENTAGE as FeeType,
    vatValue: 0,
    isActive: true,
    midtransCode: "",
  });

  const createPaymentMethodMutation = useCreatePaymentMethod({
    onSuccess: () => {
      toast.success("Payment method created successfully");
      router.push("/admin/payment-methods");
    },
    onError: (error) => {
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to create payment method",
      );
      setSaving(false);
    },
  });

  const handleImageUpload = async (file: File) => {
    try {
      setUploadingIcon(true);

      const formDataUpload = new FormData();
      formDataUpload.append("file", file);

      const response = await fetch(`/api/admin/upload?type=payment-methods`, {
        method: "POST",
        body: formDataUpload,
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Failed to upload image");
      }

      setFormData((prev) => ({ ...prev, icon: data.data.url }));
      setIconPreview(data.data.url);

      toast.success("Icon uploaded successfully");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to upload icon");
    } finally {
      setUploadingIcon(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.type || !formData.name || !formData.midtransCode) {
      toast.error("Type, name, and Midtrans code are required");
      return;
    }

    if (formData.type === PaymentMethodType.MOBILE_BANKING && !formData.bank) {
      toast.error("Bank is required for bank transfer payment method");
      return;
    }

    setSaving(true);
    const submitData = {
      ...formData,
      bank:
        formData.type === PaymentMethodType.MOBILE_BANKING
          ? formData.bank
          : null,
      description: formData.description || null,
      icon: formData.icon || null,
    };

    createPaymentMethodMutation.mutate(submitData, {
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
                  <BackButton
                    href="/admin/payment-methods"
                    label="Back to Payment Methods"
                  />
                  <div>
                    <h1 className="text-3xl font-bold">
                      Tambah Payment Method
                    </h1>
                    <p className="mt-2 text-gray-400">
                      Create a new payment method with fee and VAT configuration
                    </p>
                  </div>
                </div>

                {/* Main Content */}
                <div className="max-w-3xl">
                  <Card className="border-gray-800 bg-gray-900">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <CreditCard className="h-5 w-5" />
                        Payment Method Information
                      </CardTitle>
                      <CardDescription>
                        Fill in the details to create a new payment method
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Payment Type */}
                        <div className="space-y-2">
                          <Label
                            htmlFor="type"
                            className="flex items-center gap-2"
                          >
                            <CreditCard className="h-4 w-4" />
                            Payment Type <span className="text-red-400">*</span>
                          </Label>
                          <Select
                            value={formData.type}
                            onValueChange={(value) =>
                              setFormData({
                                ...formData,
                                type: value as PaymentMethodType,
                                bank:
                                  value === PaymentMethodType.MOBILE_BANKING
                                    ? formData.bank
                                    : ("" as BankTransferBank | ""),
                              })
                            }
                          >
                            <SelectTrigger className="border-gray-700 bg-gray-800 text-gray-100">
                              <SelectValue placeholder="Select payment type" />
                            </SelectTrigger>
                            <SelectContent className="border-gray-700 bg-gray-800 text-gray-100">
                              {Object.values(PaymentMethodType).map((type) => (
                                <SelectItem
                                  key={type}
                                  value={type}
                                  className="hover:bg-gray-700"
                                >
                                  {type.replace(/_/g, " ")}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        {/* Bank (only for MOBILE_BANKING) */}
                        {formData.type === PaymentMethodType.MOBILE_BANKING && (
                          <div className="space-y-2">
                            <Label
                              htmlFor="bank"
                              className="flex items-center gap-2"
                            >
                              <CreditCard className="h-4 w-4" />
                              Bank <span className="text-red-400">*</span>
                            </Label>
                            <Select
                              value={formData.bank}
                              onValueChange={(value) =>
                                setFormData({
                                  ...formData,
                                  bank: value as BankTransferBank,
                                })
                              }
                            >
                              <SelectTrigger className="border-gray-700 bg-gray-800 text-gray-100">
                                <SelectValue placeholder="Select bank" />
                              </SelectTrigger>
                              <SelectContent className="border-gray-700 bg-gray-800 text-gray-100">
                                {Object.values(BankTransferBank).map((bank) => (
                                  <SelectItem
                                    key={bank}
                                    value={bank}
                                    className="hover:bg-gray-700"
                                  >
                                    {bank}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        )}

                        {/* Name */}
                        <div className="space-y-2">
                          <Label
                            htmlFor="name"
                            className="flex items-center gap-2"
                          >
                            <CreditCard className="h-4 w-4" />
                            Name <span className="text-red-400">*</span>
                          </Label>
                          <Input
                            id="name"
                            value={formData.name}
                            onChange={(e) =>
                              setFormData({ ...formData, name: e.target.value })
                            }
                            placeholder="e.g. BCA Virtual Account"
                            className="border-gray-700 bg-gray-800 text-gray-100 placeholder:text-gray-500"
                          />
                        </div>

                        {/* Midtrans Code */}
                        <div className="space-y-2">
                          <Label
                            htmlFor="midtransCode"
                            className="flex items-center gap-2"
                          >
                            <CreditCard className="h-4 w-4" />
                            Midtrans Code{" "}
                            <span className="text-red-400">*</span>
                          </Label>
                          <Input
                            id="midtransCode"
                            value={formData.midtransCode}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                midtransCode: e.target.value,
                              })
                            }
                            placeholder="e.g. bca, gopay, credit_card"
                            className="border-gray-700 bg-gray-800 text-gray-100 placeholder:text-gray-500"
                          />
                        </div>

                        {/* Description */}
                        <div className="space-y-2">
                          <Label
                            htmlFor="description"
                            className="flex items-center gap-2"
                          >
                            <CreditCard className="h-4 w-4" />
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

                        {/* Icon Upload */}
                        <div className="space-y-2">
                          <Label
                            htmlFor="icon"
                            className="flex items-center gap-2"
                          >
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
                                  className="absolute -top-2 -right-2 h-6 w-6 rounded-full bg-red-500 hover:bg-red-600"
                                  onClick={() => {
                                    setIconPreview(null);
                                    setFormData((prev) => ({
                                      ...prev,
                                      icon: "",
                                    }));
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
                                      handleImageUpload(file);
                                    }
                                  }}
                                  disabled={uploadingIcon}
                                  className="file:bg-primary hover:file:bg-primary/90 cursor-pointer border-gray-700 bg-gray-800 text-gray-100 file:mr-4 file:rounded-md file:border-0 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white"
                                />
                                {uploadingIcon && (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                )}
                              </div>
                            )}
                            {/* Fallback: Manual URL input */}
                            {!iconPreview && (
                              <div className="mt-2">
                                <Label
                                  htmlFor="icon-url"
                                  className="text-xs text-gray-400"
                                >
                                  Or enter URL manually:
                                </Label>
                                <Input
                                  id="icon-url"
                                  value={formData.icon}
                                  onChange={(e) =>
                                    setFormData({
                                      ...formData,
                                      icon: e.target.value,
                                    })
                                  }
                                  placeholder="https://example.com/icon.png"
                                  className="mt-1 border-gray-700 bg-gray-800 text-gray-100 placeholder:text-gray-500"
                                />
                              </div>
                            )}
                          </div>
                        </div>

                        <Separator className="bg-gray-700" />

                        {/* Fee Configuration */}
                        <div className="space-y-4">
                          <h3 className="flex items-center gap-2 text-lg font-semibold">
                            <DollarSign className="h-5 w-5" />
                            Fee Configuration
                          </h3>
                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label htmlFor="feeType">Fee Type</Label>
                              <Select
                                value={formData.feeType}
                                onValueChange={(value) =>
                                  setFormData({
                                    ...formData,
                                    feeType: value as FeeType,
                                  })
                                }
                              >
                                <SelectTrigger className="border-gray-700 bg-gray-800 text-gray-100">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent className="border-gray-700 bg-gray-800 text-gray-100">
                                  <SelectItem
                                    value={FeeType.PERCENTAGE}
                                    className="hover:bg-gray-700"
                                  >
                                    Percentage
                                  </SelectItem>
                                  <SelectItem
                                    value={FeeType.FIXED}
                                    className="hover:bg-gray-700"
                                  >
                                    Fixed Amount
                                  </SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="feeValue">Fee Value</Label>
                              <Input
                                id="feeValue"
                                type="number"
                                step="0.01"
                                value={formData.feeValue}
                                onChange={(e) =>
                                  setFormData({
                                    ...formData,
                                    feeValue: parseFloat(e.target.value) || 0,
                                  })
                                }
                                placeholder={
                                  formData.feeType === FeeType.PERCENTAGE
                                    ? "2.5"
                                    : "5000"
                                }
                                className="border-gray-700 bg-gray-800 text-gray-100 placeholder:text-gray-500"
                              />
                            </div>
                          </div>
                        </div>

                        {/* VAT Configuration */}
                        <div className="space-y-4">
                          <h3 className="flex items-center gap-2 text-lg font-semibold">
                            <DollarSign className="h-5 w-5" />
                            VAT Configuration
                          </h3>
                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label htmlFor="vatType">VAT Type</Label>
                              <Select
                                value={formData.vatType}
                                onValueChange={(value) =>
                                  setFormData({
                                    ...formData,
                                    vatType: value as FeeType,
                                  })
                                }
                              >
                                <SelectTrigger className="border-gray-700 bg-gray-800 text-gray-100">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent className="border-gray-700 bg-gray-800 text-gray-100">
                                  <SelectItem
                                    value={FeeType.PERCENTAGE}
                                    className="hover:bg-gray-700"
                                  >
                                    Percentage
                                  </SelectItem>
                                  <SelectItem
                                    value={FeeType.FIXED}
                                    className="hover:bg-gray-700"
                                  >
                                    Fixed Amount
                                  </SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="vatValue">VAT Value</Label>
                              <Input
                                id="vatValue"
                                type="number"
                                step="0.01"
                                value={formData.vatValue}
                                onChange={(e) =>
                                  setFormData({
                                    ...formData,
                                    vatValue: parseFloat(e.target.value) || 0,
                                  })
                                }
                                placeholder={
                                  formData.vatType === FeeType.PERCENTAGE
                                    ? "11"
                                    : "500"
                                }
                                className="border-gray-700 bg-gray-800 text-gray-100 placeholder:text-gray-500"
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
                            onClick={() =>
                              router.push("/admin/payment-methods")
                            }
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
                                Create Payment Method
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
