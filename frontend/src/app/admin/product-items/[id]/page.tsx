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
import { useAdminProductItem, useUpdateProductItem } from "@/lib/queries";
import { formatDateTime } from "@/lib/date-utils";

interface ProductItemDetail {
  id: string;
  name: string;
  skuCode: string;
  iconImage: string | null;
  group: string | null;
  basePrice: number;
  normalPrice: number;
  discountedPrice: number | null;
  sellPrice: number;
  isActive: boolean;
  digiflazzStatus: string | null;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
  lastSyncedAt: string | null;
  product: {
    id: string;
    name: string;
    category: {
      id: string;
      name: string;
    };
  };
}

export default function ProductItemEditPage() {
  const router = useRouter();
  const params = useParams();
  const itemId = params?.id as string;

  const [saving, setSaving] = useState(false);
  const [isActive, setIsActive] = useState<boolean>(false);
  const [iconImage, setIconImage] = useState<string | null>(null);
  const [group, setGroup] = useState<string>("");
  const [uploadingImage, setUploadingImage] = useState(false);
  const [iconPreview, setIconPreview] = useState<string | null>(null);
  const [normalPrice, setNormalPrice] = useState<number>(0);
  const [discountedPrice, setDiscountedPrice] = useState<number | null>(null);
  const [sellPrice, setSellPrice] = useState<number>(0);
  const [basePrice, setBasePrice] = useState<number>(0);
  const [sortOrder, setSortOrder] = useState<number>(0);

  const { data: itemData, isLoading: loading, error } = useAdminProductItem(itemId);
  const typedItemData = itemData as ProductItemDetail | null | undefined;

  useEffect(() => {
    if (typedItemData) {
      setIsActive(typedItemData.isActive);
      setIconImage(typedItemData.iconImage);
      setGroup(typedItemData.group || "");
      setIconPreview(typedItemData.iconImage);
      setNormalPrice(typedItemData.normalPrice);
      setDiscountedPrice(typedItemData.discountedPrice);
      setSellPrice(typedItemData.sellPrice);
      setBasePrice(typedItemData.basePrice);
      setSortOrder(typedItemData.sortOrder);
    }
  }, [typedItemData]);

  const updateItemMutation = useUpdateProductItem({
    onSuccess: () => {
      toast.success("Product item updated successfully");
      router.push("/admin/price-list");
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Failed to update product item");
      setSaving(false);
    },
  });

  const handleImageUpload = async (file: File) => {
    try {
      setUploadingImage(true);

      const formDataUpload = new FormData();
      formDataUpload.append("file", file);

      const response = await fetch(`/api/admin/upload?type=product-items`, {
        method: "POST",
        body: formDataUpload,
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Failed to upload image");
      }

      setIconImage(data.data.url);
      setIconPreview(data.data.url);
      toast.success("Image uploaded successfully");
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to upload image"
      );
    } finally {
      setUploadingImage(false);
    }
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
    updateItemMutation.mutate(
      {
        id: itemId,
        data: {
          isActive,
          iconImage: iconImage || null,
          group: group || null,
          normalPrice: normalPrice || 0,
          discountedPrice: discountedPrice || null,
          sellPrice: sellPrice || 0,
          basePrice: basePrice || 0,
          sortOrder: sortOrder || 0,
        }
      },
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

  if (error || !typedItemData) {
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
              {error instanceof Error ? error.message : "Product item not found"}
            </p>
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
                              {typedItemData.name}
                            </div>
                          </div>

                          {/* SKU Code */}
                          <div className="space-y-2">
                            <Label className="flex items-center gap-2">
                              <Package className="h-4 w-4" />
                              SKU Code
                            </Label>
                            <div className="text-sm text-gray-200 font-mono bg-gray-800 px-3 py-2 rounded-md">
                              {typedItemData.skuCode}
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
                                    setIconImage(null);
                                  }}
                                >
                                  <X className="h-4 w-4 text-white" />
                                </Button>
                              </div>
                            ) : (
                              <div className="flex items-center gap-2">
                                <Input
                                  type="file"
                                  accept="image/*"
                                  onChange={(e) => {
                                    const file = e.target.files?.[0];
                                    if (file) {
                                      handleImageUpload(file);
                                    }
                                  }}
                                  disabled={uploadingImage}
                                  className="cursor-pointer"
                                />
                                {uploadingImage && (
                                  <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
                                )}
                              </div>
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
                              <Label htmlFor="basePrice">Base Price (Cost from Digiflazz)</Label>
                              <Input
                                id="basePrice"
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
                              <Label htmlFor="normalPrice">Normal Price</Label>
                              <Input
                                id="normalPrice"
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
                              <Label htmlFor="discountedPrice">Discounted Price (Optional)</Label>
                              <Input
                                id="discountedPrice"
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
                              <Label htmlFor="sellPrice">Sell Price (Current Effective Price)</Label>
                              <Input
                                id="sellPrice"
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
                            <Label htmlFor="sortOrder">Sort Order</Label>
                            <Input
                              id="sortOrder"
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
                            <Label htmlFor="isActive" className="flex items-center gap-2">
                              <CheckCircle2 className="h-4 w-4" />
                              Status
                            </Label>
                            <div className="flex items-center space-x-2">
                              <Checkbox
                                id="isActive"
                                checked={isActive}
                                onCheckedChange={(checked) => setIsActive(checked === true)}
                                className="border-gray-700"
                              />
                              <label
                                htmlFor="isActive"
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
                                  Update Status
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
                            variant={typedItemData.isActive ? "default" : "secondary"}
                            className={typedItemData.isActive ? "bg-green-600/20 text-green-400" : "bg-gray-600/20 text-gray-400"}
                          >
                            {typedItemData.isActive ? "Active" : "Inactive"}
                          </Badge>
                        </div>
                        {typedItemData.digiflazzStatus && (
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-400">Digiflazz Status</span>
                            <Badge variant="secondary" className="bg-blue-600/20 text-blue-400">
                              {typedItemData.digiflazzStatus}
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
                          <p className="text-sm text-gray-200">{typedItemData.product.name}</p>
                        </div>
                        <div>
                          <span className="text-xs text-gray-400">Category</span>
                          <p className="text-sm text-gray-200">{typedItemData.product.category.name}</p>
                        </div>
                        {typedItemData.iconImage && (
                          <div>
                            <span className="text-xs text-gray-400">Icon</span>
                            <div className="mt-2 h-24 w-24 overflow-hidden rounded-md">
                              <Image
                                src={typedItemData.iconImage}
                                alt={typedItemData.name}
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
                            {formatPrice(typedItemData.basePrice)}
                          </p>
                        </div>
                        <div>
                          <span className="text-xs text-gray-400">Normal Price</span>
                          <p className="text-sm text-gray-200">
                            {formatPrice(typedItemData.normalPrice)}
                          </p>
                        </div>
                        {typedItemData.discountedPrice && (
                          <div>
                            <span className="text-xs text-gray-400">Discounted Price</span>
                            <p className="text-sm text-gray-200">
                              {formatPrice(typedItemData.discountedPrice)}
                            </p>
                          </div>
                        )}
                        <div>
                          <span className="text-xs text-gray-400">Sell Price</span>
                          <p className="text-sm text-gray-200 font-semibold text-green-400">
                            {formatPrice(typedItemData.sellPrice)}
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
                          <p className="text-sm text-gray-200">{typedItemData.sortOrder}</p>
                        </div>
                        <div>
                          <span className="text-xs text-gray-400">Created At</span>
                          <p className="text-sm text-gray-200">
                            {formatDateTime(typedItemData.createdAt)}
                          </p>
                        </div>
                        <div>
                          <span className="text-xs text-gray-400">Updated At</span>
                          <p className="text-sm text-gray-200">
                            {formatDateTime(typedItemData.updatedAt)}
                          </p>
                        </div>
                        {typedItemData.lastSyncedAt && (
                          <div>
                            <span className="text-xs text-gray-400">Last Synced At</span>
                            <p className="text-sm text-gray-200">
                              {formatDateTime(typedItemData.lastSyncedAt)}
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

