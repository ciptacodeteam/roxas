"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import Image from "next/image";
import { Loader2, Save, Package, Calendar, CheckCircle2, DollarSign, Upload, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
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
import { Checkbox } from "@/components/ui/checkbox";
import { useProductItem, useUpdateProductItem } from "@/lib/product-items";
import { formatDateTime } from "@/lib/date-utils";

export default function ProductItemEditPage() {
  const params = useParams();
  const router = useRouter();
  const itemId = params.id as string;

  const { data: productItem, isLoading, isError } = useProductItem(itemId);
  const updateItemMutation = useUpdateProductItem();

  const [isActive, setIsActive] = useState(false);
  const [iconFile, setIconFile] = useState<File | null>(null);
  const [iconPreview, setIconPreview] = useState<string | null>(null);
  const [group, setGroup] = useState("");
  const [basePrice, setBasePrice] = useState(0);
  const [normalPrice, setNormalPrice] = useState(0);
  const [discountedPrice, setDiscountedPrice] = useState<number | null>(null);
  const [sellPrice, setSellPrice] = useState(0);
  const [sortOrder, setSortOrder] = useState(0);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (productItem) {
      setIsActive(productItem.is_active);
      setIconPreview(productItem.icon_image || null);
      setGroup(productItem.group || "");
      setBasePrice(productItem.base_price);
      setNormalPrice(productItem.normal_price);
      setDiscountedPrice(productItem.discounted_price);
      setSellPrice(productItem.sell_price);
      setSortOrder(productItem.sort_order);
    }
  }, [productItem]);

  const handleIconChange = (file: File) => {
    setIconFile(file);

    const reader = new FileReader();
    reader.onloadend = () => {
      setIconPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(price);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setSaving(true);

    const submitData: Record<string, unknown> = {
      is_active: isActive,
      group: group || null,
      normal_price: normalPrice || 0,
      discounted_price: discountedPrice || null,
      sell_price: sellPrice || 0,
      base_price: basePrice || 0,
      sort_order: sortOrder || 0,
    };

    if (iconFile) {
      submitData.icon_image = iconFile;
    } else if (!iconPreview) {
      submitData.icon_image = null;
    }

    updateItemMutation.mutate(
      {
        id: itemId,
        data: submitData,
      },
      {
        onSuccess: () => {
          toast.success("Product item updated successfully");
          router.push("/admin/product-items");
        },
        onError: (error) => {
          toast.error(error.message || "Failed to update product item");
        },
        onSettled: () => {
          setSaving(false);
        },
      }
    );
  };

  if (isLoading) {
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

  if (isError || !productItem) {
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
            <p className="text-red-400">Product item not found</p>
            <Button
              onClick={() => router.push("/admin/product-items")}
              className="mt-4"
            >
              Back to Product Items
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
                  <BackButton href="/admin/product-items" label="Back to Product Items" />
                  <div>
                    <h1 className="text-3xl font-bold">Edit Product Item</h1>
                    <p className="mt-2 text-gray-400">
                      View product item details and update status
                    </p>
                  </div>
                </div>

                {/* Main Content - Two Column Layout */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Left Column - Status Update Form */}
                  <div className="lg:col-span-2">
                    <Card className="bg-gray-900 border-gray-800">
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Package className="h-5 w-5" />
                          Product Item Information
                        </CardTitle>
                        <CardDescription>
                          Update product item information, pricing, and settings
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <form onSubmit={handleSubmit} className="space-y-6">
                          {/* Name */}
                          <div className="space-y-2">
                            <Label className="flex items-center gap-2">
                              <Package className="h-4 w-4" />
                              Name
                            </Label>
                            <div className="text-sm text-gray-200 bg-gray-800 px-3 py-2 rounded-md">
                              {productItem.name}
                            </div>
                          </div>

                          {/* SKU Code */}
                          <div className="space-y-2">
                            <Label className="flex items-center gap-2">
                              <Package className="h-4 w-4" />
                              SKU Code
                            </Label>
                            <div className="text-sm text-gray-200 font-mono bg-gray-800 px-3 py-2 rounded-md">
                              {productItem.sku_code}
                            </div>
                          </div>

                          {/* Icon Image Upload */}
                          <div className="space-y-2">
                            <Label className="flex items-center gap-2">
                              <Upload className="h-4 w-4" />
                              Icon Image
                            </Label>
                            {iconPreview ? (
                              <div className="relative">
                                <div className="h-32 w-32 overflow-hidden rounded-md border border-gray-700">
                                  <Image
                                    src={iconPreview}
                                    alt="Icon preview"
                                    width={128}
                                    height={128}
                                    className="h-full w-full object-cover"
                                  />
                                </div>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  className="absolute -right-2 -top-2 h-6 w-6 rounded-full bg-red-600 hover:bg-red-700"
                                  onClick={() => {
                                    setIconPreview(null);
                                    setIconFile(null);
                                  }}
                                >
                                  <X className="h-4 w-4 text-white" />
                                </Button>
                              </div>
                            ) : (
                              <Input
                                type="file"
                                accept="image/*"
                                onChange={(e) => {
                                  const file = e.target.files?.[0];
                                  if (file) {
                                    handleIconChange(file);
                                  }
                                }}
                                className="cursor-pointer"
                              />
                            )}
                            <p className="text-xs text-gray-400">
                              Upload an icon/image for this product item
                            </p>
                          </div>

                          {/* Group Field */}
                          <div className="space-y-2">
                            <Label htmlFor="group" className="flex items-center gap-2">
                              <Package className="h-4 w-4" />
                              Group
                            </Label>
                            <Input
                              id="group"
                              type="text"
                              value={group}
                              onChange={(e) => setGroup(e.target.value)}
                              placeholder="e.g., Diamond, Weekly Pass"
                              className="bg-gray-800 border-gray-700"
                            />
                            <p className="text-xs text-gray-400">
                              Group name for organizing items (optional). Items with the same group will be displayed together.
                            </p>
                          </div>

                          <Separator className="bg-gray-700" />

                          {/* Pricing Fields */}
                          <div className="space-y-4">
                            <Label className="flex items-center gap-2">
                              <DollarSign className="h-4 w-4" />
                              Pricing (IDR)
                            </Label>

                            {/* Base Price */}
                            <div className="space-y-2">
                              <Label htmlFor="base_price">Base Price (Cost from Digiflazz)</Label>
                              <Input
                                id="base_price"
                                type="number"
                                min="0"
                                value={basePrice}
                                onChange={(e) => setBasePrice(Number(e.target.value) || 0)}
                                className="bg-gray-800 border-gray-700"
                              />
                              <p className="text-xs text-gray-400">
                                Original cost from Digiflazz
                              </p>
                            </div>

                            {/* Normal Price */}
                            <div className="space-y-2">
                              <Label htmlFor="normal_price">Normal Price</Label>
                              <Input
                                id="normal_price"
                                type="number"
                                min="0"
                                value={normalPrice}
                                onChange={(e) => setNormalPrice(Number(e.target.value) || 0)}
                                className="bg-gray-800 border-gray-700"
                              />
                              <p className="text-xs text-gray-400">
                                Regular selling price
                              </p>
                            </div>

                            {/* Discounted Price */}
                            <div className="space-y-2">
                              <Label htmlFor="discounted_price">Discounted Price (Optional)</Label>
                              <Input
                                id="discounted_price"
                                type="number"
                                min="0"
                                value={discountedPrice || ""}
                                onChange={(e) => setDiscountedPrice(e.target.value ? Number(e.target.value) : null)}
                                placeholder="Leave empty for no discount"
                                className="bg-gray-800 border-gray-700"
                              />
                              <p className="text-xs text-gray-400">
                                Sale/discounted price (optional). If set, this will be used as the sell price.
                              </p>
                            </div>

                            {/* Sell Price */}
                            <div className="space-y-2">
                              <Label htmlFor="sell_price">Sell Price (Current Effective Price)</Label>
                              <Input
                                id="sell_price"
                                type="number"
                                min="0"
                                value={sellPrice}
                                onChange={(e) => setSellPrice(Number(e.target.value) || 0)}
                                className="bg-gray-800 border-gray-700"
                              />
                              <p className="text-xs text-gray-400">
                                Current effective selling price shown to customers
                              </p>
                            </div>
                          </div>

                          <Separator className="bg-gray-700" />

                          {/* Sort Order */}
                          <div className="space-y-2">
                            <Label htmlFor="sort_order">Sort Order</Label>
                            <Input
                              id="sort_order"
                              type="number"
                              value={sortOrder}
                              onChange={(e) => setSortOrder(Number(e.target.value) || 0)}
                              className="bg-gray-800 border-gray-700"
                            />
                            <p className="text-xs text-gray-400">
                              Lower numbers appear first. Used for ordering items in lists.
                            </p>
                          </div>

                          <Separator className="bg-gray-700" />

                          {/* Status Update */}
                          <div className="space-y-2">
                            <Label htmlFor="is_active" className="flex items-center gap-2">
                              <CheckCircle2 className="h-4 w-4" />
                              Status
                            </Label>
                            <div className="flex items-center space-x-2">
                              <Checkbox
                                id="is_active"
                                checked={isActive}
                                onCheckedChange={(checked) => setIsActive(checked === true)}
                                className="border-gray-700"
                              />
                              <label
                                htmlFor="is_active"
                                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                              >
                                Active
                              </label>
                            </div>
                            <p className="text-xs text-gray-400">
                              Toggle to activate or deactivate this product item
                            </p>
                          </div>

                          <Separator className="bg-gray-700" />

                          {/* Submit Button */}
                          <div className="flex justify-end gap-3">
                            <Button
                              type="button"
                              variant="outline"
                              onClick={() => router.push("/admin/product-items")}
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
                                  Update Product Item
                                </>
                              )}
                            </Button>
                          </div>
                        </form>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Right Column - Product Item Details */}
                  <div className="space-y-6">
                    {/* Status */}
                    <Card className="bg-gray-900 border-gray-800">
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Package className="h-5 w-5" />
                          Status
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-400">Current Status</span>
                          <Badge
                            variant={productItem.is_active ? "default" : "secondary"}
                            className={productItem.is_active ? "bg-green-600/20 text-green-400" : "bg-gray-600/20 text-gray-400"}
                          >
                            {productItem.is_active ? "Active" : "Inactive"}
                          </Badge>
                        </div>
                        {productItem.digiflazz_status && (
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-400">Digiflazz Status</span>
                            <Badge variant="secondary" className="bg-blue-600/20 text-blue-400">
                              {productItem.digiflazz_status}
                            </Badge>
                          </div>
                        )}
                      </CardContent>
                    </Card>

                    {/* Product Information */}
                    <Card className="bg-gray-900 border-gray-800">
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Package className="h-5 w-5" />
                          Product
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div>
                          <span className="text-xs text-gray-400">Product</span>
                          <p className="text-sm text-gray-200">{productItem.product_details?.name || 'N/A'}</p>
                        </div>
                        <div>
                          <span className="text-xs text-gray-400">Category</span>
                          <p className="text-sm text-gray-200">{productItem.product_details?.category_name || 'N/A'}</p>
                        </div>
                        {productItem.icon_image && (
                          <div>
                            <span className="text-xs text-gray-400">Icon</span>
                            <div className="mt-2 h-24 w-24 overflow-hidden rounded-md">
                              <Image
                                src={productItem.icon_image}
                                alt={productItem.name}
                                width={96}
                                height={96}
                                className="h-full w-full object-cover"
                              />
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>

                    {/* Pricing Information */}
                    <Card className="bg-gray-900 border-gray-800">
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <DollarSign className="h-5 w-5" />
                          Pricing
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div>
                          <span className="text-xs text-gray-400">Base Price</span>
                          <p className="text-sm text-gray-200 font-semibold">
                            {formatPrice(productItem.base_price)}
                          </p>
                        </div>
                        <div>
                          <span className="text-xs text-gray-400">Normal Price</span>
                          <p className="text-sm text-gray-200">
                            {formatPrice(productItem.normal_price)}
                          </p>
                        </div>
                        {productItem.discounted_price && (
                          <div>
                            <span className="text-xs text-gray-400">Discounted Price</span>
                            <p className="text-sm text-gray-200">
                              {formatPrice(productItem.discounted_price)}
                            </p>
                          </div>
                        )}
                        <div>
                          <span className="text-xs text-gray-400">Sell Price</span>
                          <p className="text-sm font-semibold text-green-400">
                            {formatPrice(productItem.sell_price)}
                          </p>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Product Item Metadata */}
                    <Card className="bg-gray-900 border-gray-800">
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Calendar className="h-5 w-5" />
                          Metadata
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div>
                          <span className="text-xs text-gray-400">Sort Order</span>
                          <p className="text-sm text-gray-200">{productItem.sort_order}</p>
                        </div>
                        <div>
                          <span className="text-xs text-gray-400">Created At</span>
                          <p className="text-sm text-gray-200">
                            {formatDateTime(productItem.created_at)}
                          </p>
                        </div>
                        <div>
                          <span className="text-xs text-gray-400">Updated At</span>
                          <p className="text-sm text-gray-200">
                            {formatDateTime(productItem.updated_at)}
                          </p>
                        </div>
                        {productItem.last_synced_at && (
                          <div>
                            <span className="text-xs text-gray-400">Last Synced At</span>
                            <p className="text-sm text-gray-200">
                              {formatDateTime(productItem.last_synced_at)}
                            </p>
                          </div>
                        )}
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
