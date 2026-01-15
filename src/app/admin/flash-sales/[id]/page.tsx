"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { Loader2, Save, Calendar, CheckCircle2, Plus, X, Tag } from "lucide-react";
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
import { DateTimePicker } from "@/components/ui/date-time-picker";
import { useAdminFlashSale, useUpdateFlashSale, useAdminProductItemsSelect } from "@/lib/queries";
import { ProductSelectCombobox } from "@/components/admin/product-select-combobox";
import { formatDateTime } from "@/lib/date-utils";

interface FlashSaleItem {
  id: string;
  productItemId: string;
  salePrice: number;
  stock: number;
  soldCount: number;
  productItem: {
    id: string;
    name: string;
    sellPrice: number;
    product: {
      name: string;
      category: {
        name: string;
      };
    };
  };
}

interface FlashSaleDetail {
  id: string;
  name: string;
  startTime: string;
  endTime: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  items: FlashSaleItem[];
}

export default function FlashSaleEditPage() {
  const router = useRouter();
  const params = useParams();
  const flashSaleId = params?.id as string;

  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState<{
    name: string;
    startTime: string;
    endTime: string;
    isActive: boolean;
  }>({
    name: "",
    startTime: "",
    endTime: "",
    isActive: true,
  });
  const [items, setItems] = useState<Array<{ productItemId: string; salePrice: number; stock: number }>>([]);

  const { data: productItems = [] } = useAdminProductItemsSelect();
  const { data: flashSaleData, isLoading: loading, error } = useAdminFlashSale(flashSaleId);
  const typedFlashSaleData = flashSaleData as FlashSaleDetail | null | undefined;

  useEffect(() => {
    if (typedFlashSaleData) {
      setFormData({
        name: typedFlashSaleData.name,
        startTime: typedFlashSaleData.startTime ? new Date(typedFlashSaleData.startTime).toISOString().slice(0, 16) : "",
        endTime: typedFlashSaleData.endTime ? new Date(typedFlashSaleData.endTime).toISOString().slice(0, 16) : "",
        isActive: typedFlashSaleData.isActive,
      });
      // Ensure productItemId is a string to match SelectItem values exactly
      setItems(typedFlashSaleData.items.map(item => ({
        productItemId: String(item.productItemId || ""),
        salePrice: item.salePrice,
        stock: item.stock,
      })));
    }
  }, [typedFlashSaleData]);

  const updateFlashSaleMutation = useUpdateFlashSale({
    onSuccess: () => {
      toast.success("Flash sale updated successfully");
      router.push("/admin/flash-sales");
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Failed to update flash sale");
      setSaving(false);
    },
  });

  const addItem = () => {
    setItems([...items, { productItemId: "", salePrice: 0, stock: 0 }]);
  };

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const updateItem = (index: number, field: "productItemId" | "salePrice" | "stock", value: string | number) => {
    console.log('updateItem called:', { index, field, value });
    setItems(prevItems => {
      const newItems = [...prevItems];
      const currentItem = newItems[index];
      if (!currentItem) return prevItems;

      const updatedItem: { productItemId: string; salePrice: number; stock: number } = {
        productItemId: field === "productItemId" ? (value as string) : currentItem.productItemId,
        salePrice: field === "salePrice" ? (value as number) : currentItem.salePrice,
        stock: field === "stock" ? (value as number) : currentItem.stock,
      };

      newItems[index] = updatedItem;
      console.log('Updated items:', newItems);
      return newItems;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name || !formData.startTime || !formData.endTime) {
      toast.error("Name, start time, and end time are required");
      return;
    }

    if (items.length === 0 || items.every(item => !item.productItemId)) {
      toast.error("At least one item is required");
      return;
    }

    setSaving(true);
    const submitData = {
      ...formData,
      items: items.filter(item => item.productItemId),
    };

    updateFlashSaleMutation.mutate(
      { id: flashSaleId, data: submitData },
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

  if (error || !typedFlashSaleData) {
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
              {error instanceof Error ? error.message : "Flash sale not found"}
            </p>
            <Button
              onClick={() => router.push("/admin/flash-sales")}
              className="mt-4"
            >
              Back to Flash Sales
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
                  <BackButton href="/admin/flash-sales" label="Back to Flash Sales" />
                  <div>
                    <h1 className="text-3xl font-bold">Edit Flash Sale</h1>
                    <p className="mt-2 text-gray-400">
                      Manage flash sale information and view related data
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
                          <Tag className="h-5 w-5" />
                          Flash Sale Information
                        </CardTitle>
                        <CardDescription>
                          Update flash sale details
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <form onSubmit={handleSubmit} className="space-y-6">
                          {/* Name */}
                          <div className="space-y-2">
                            <Label htmlFor="name" className="flex items-center gap-2">
                              <Tag className="h-4 w-4" />
                              Name <span className="text-red-400">*</span>
                            </Label>
                            <Input
                              id="name"
                              type="text"
                              value={formData.name}
                              onChange={(e) =>
                                setFormData({ ...formData, name: e.target.value })
                              }
                              className="bg-gray-800 text-gray-100 border-gray-700"
                              required
                            />
                          </div>

                          {/* Date Range */}
                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label htmlFor="startTime" className="flex items-center gap-2">
                                <Calendar className="h-4 w-4" />
                                Start Time <span className="text-red-400">*</span>
                              </Label>
                              <DateTimePicker
                                value={formData.startTime || undefined}
                                onChange={(value) =>
                                  setFormData({ ...formData, startTime: value })
                                }
                                placeholder="Select start date and time"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="endTime" className="flex items-center gap-2">
                                <Calendar className="h-4 w-4" />
                                End Time <span className="text-red-400">*</span>
                              </Label>
                              <DateTimePicker
                                value={formData.endTime || undefined}
                                onChange={(value) =>
                                  setFormData({ ...formData, endTime: value })
                                }
                                placeholder="Select end date and time"
                              />
                            </div>
                          </div>

                          {/* Items */}
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <Label className="flex items-center gap-2">
                                <Tag className="h-4 w-4" />
                                Items <span className="text-red-400">*</span>
                              </Label>
                              <Button type="button" onClick={addItem} size="sm" variant="outline">
                                <Plus className="mr-2 h-4 w-4" />
                                Add Item
                              </Button>
                            </div>
                            <div className="space-y-2 max-h-64 overflow-y-auto">
                              {items.map((item, index) => {
                                const selectedProduct = productItems.find(p => p.id === item.productItemId);
                                return (
                                  <div key={index} className="flex gap-2 items-end p-3 border border-gray-700 rounded-md">
                                    <div className="flex-1">
                                      <Label className="text-gray-200 text-xs mb-1 block">Product Item</Label>
                                      <ProductSelectCombobox
                                        items={productItems}
                                        value={item.productItemId || ""}
                                        onValueChange={(value) => {
                                          if (!value?.trim()) return;
                                          const product = productItems.find(p => String(p.id) === String(value));
                                          updateItem(index, "productItemId", value);
                                          if (product) {
                                            updateItem(index, "salePrice", product.sellPrice);
                                          }
                                        }}
                                        placeholder="Search product..."
                                      />
                                    </div>
                                    <div className="w-32">
                                      <Label className="text-gray-200 text-xs mb-1 block">Sale Price</Label>
                                      <Input
                                        type="number"
                                        value={item.salePrice}
                                        onChange={(e) =>
                                          updateItem(index, "salePrice", parseInt(e.target.value) || 0)
                                        }
                                        className="bg-gray-800 text-gray-100 border-gray-700"
                                      />
                                    </div>
                                    <div className="w-32">
                                      <Label className="text-gray-200 text-xs mb-1 block">Stock</Label>
                                      <Input
                                        type="number"
                                        value={item.stock}
                                        onChange={(e) =>
                                          updateItem(index, "stock", parseInt(e.target.value) || 0)
                                        }
                                        className="bg-gray-800 text-gray-100 border-gray-700"
                                      />
                                    </div>
                                    <Button
                                      type="button"
                                      variant="ghost"
                                      size="icon"
                                      onClick={() => removeItem(index)}
                                    >
                                      <X className="h-4 w-4" />
                                    </Button>
                                  </div>
                                );
                              })}
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
                                  isActive: !!checked,
                                })
                              }
                            />
                            <Label htmlFor="isActive" className="cursor-pointer flex items-center gap-2">
                              <CheckCircle2 className="h-4 w-4" />
                              Active (visible to users)
                            </Label>
                          </div>

                          <Separator className="bg-gray-700" />

                          {/* Submit Button */}
                          <div className="flex justify-end gap-3">
                            <Button
                              type="button"
                              variant="outline"
                              onClick={() => router.push("/admin/flash-sales")}
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
                    {/* Flash Sale Status */}
                    <Card className="bg-gray-900 border-gray-800">
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Tag className="h-5 w-5" />
                          Status
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-400">Status</span>
                          <Badge
                            variant={typedFlashSaleData.isActive ? "default" : "secondary"}
                            className={
                              typedFlashSaleData.isActive
                                ? "bg-green-600/20 text-green-400"
                                : "bg-gray-600/20 text-gray-400"
                            }
                          >
                            {typedFlashSaleData.isActive ? "Active" : "Inactive"}
                          </Badge>
                        </div>
                        <div>
                          <span className="text-xs text-gray-400">Start Time</span>
                          <p className="text-sm text-gray-200">
                            {formatDateTime(typedFlashSaleData.startTime)}
                          </p>
                        </div>
                        <div>
                          <span className="text-xs text-gray-400">End Time</span>
                          <p className="text-sm text-gray-200">
                            {formatDateTime(typedFlashSaleData.endTime)}
                          </p>
                        </div>
                        <div>
                          <span className="text-xs text-gray-400">Items Count</span>
                          <p className="text-sm text-gray-200">
                            {typedFlashSaleData.items.length} items
                          </p>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Flash Sale Metadata */}
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
                            {formatDateTime(typedFlashSaleData.createdAt)}
                          </p>
                        </div>
                        <div>
                          <span className="text-xs text-gray-400">Updated At</span>
                          <p className="text-sm text-gray-200">
                            {formatDateTime(typedFlashSaleData.updatedAt)}
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

