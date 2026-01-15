"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
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
import { DateTimePicker } from "@/components/ui/date-time-picker";
import { useCreateFlashSale, useAdminProductItemsSelect, queryKeys } from "@/lib/queries";
import { ProductSelectCombobox } from "@/components/admin/product-select-combobox";

export default function FlashSaleAddPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    startTime: "",
    endTime: "",
    isActive: true,
  });
  const [items, setItems] = useState<Array<{ productItemId: string; salePrice: number; stock: number }>>([]);

  const { data: productItems = [] } = useAdminProductItemsSelect();

  const createFlashSaleMutation = useCreateFlashSale({
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.flashSales.lists() });
      await queryClient.refetchQueries({ queryKey: queryKeys.flashSales.lists() });
      toast.success("Flash sale created successfully");
      router.push("/admin/flash-sales");
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Failed to create flash sale");
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

    createFlashSaleMutation.mutate(submitData, {
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
                  <BackButton href="/admin/flash-sales" label="Back to Flash Sales" />
                  <div>
                    <h1 className="text-3xl font-bold">Tambah Flash Sale</h1>
                    <p className="mt-2 text-gray-400">
                      Create a new flash sale for your store
                    </p>
                  </div>
                </div>

                {/* Main Content */}
                <div className="max-w-3xl">
                  <Card className="bg-gray-900 border-gray-800">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Tag className="h-5 w-5" />
                        Flash Sale Information
                      </CardTitle>
                      <CardDescription>
                        Fill in the details to create a new flash sale
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
                            placeholder="Flash Sale Name"
                            className="bg-gray-800 text-gray-100 border-gray-700 placeholder:text-gray-500"
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
                            {items.length === 0 && (
                              <p className="text-sm text-gray-400 text-center py-4">
                                No items added. Click "Add Item" to add products to this flash sale.
                              </p>
                            )}
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
                                Creating...
                              </>
                            ) : (
                              <>
                                <Save className="mr-2 h-4 w-4" />
                                Create Flash Sale
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

