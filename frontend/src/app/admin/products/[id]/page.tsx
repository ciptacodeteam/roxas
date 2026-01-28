"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import Image from "next/image";
import { Loader2, Save, Package, Hash, ArrowUpDown, CheckCircle2, Upload, X, FileText, Calendar, ShoppingBag, Calculator } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { BackButton } from "@/components/admin/back-button";
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
import { Textarea } from "@/components/ui/textarea";
import { useAdminProduct, useUpdateProduct, useAdminCategories, useAdminProductItems } from "@/lib/queries";
import { formatDateTime } from "@/lib/date-utils";

interface ProductDetail {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  image: string | null;
  bannerImage: string | null;
  category: {
    id: string;
    name: string;
  };
  isActive: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
  items: Array<{
    id: string;
    name: string;
    skuCode: string;
    isActive: boolean;
  }>;
  _count: {
    items: number;
  };
}

export default function ProductEditPage() {
  const router = useRouter();
  const params = useParams();
  const productId = params?.id as string;

  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState<{
    name: string;
    slug: string;
    description: string;
    categoryId: string;
    image: string;
    bannerImage: string;
    isActive: boolean;
    sortOrder: number;
  }>({
    name: "",
    slug: "",
    description: "",
    categoryId: "",
    image: "",
    bannerImage: "",
    isActive: true,
    sortOrder: 0,
  });
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [bannerPreview, setBannerPreview] = useState<string | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadingBanner, setUploadingBanner] = useState(false);

  // Bulk price update state
  const [marginPercentage, setMarginPercentage] = useState("5");
  const [priceBase, setPriceBase] = useState<"basePrice" | "normalPrice">("basePrice");
  const [bulkUpdating, setBulkUpdating] = useState(false);

  // Use React Query to fetch product data
  const { data: productData, isLoading: loading, error } = useAdminProduct(productId, {
    refetchOnMount: "always",
    refetchOnWindowFocus: true,
    staleTime: 0,
  });
  const typedProductData = productData as ProductDetail | null | undefined;
  const { data: categories = [] } = useAdminCategories();
  const { data: productItemsData = [] } = useAdminProductItems();

  // Update form data when product data changes
  useEffect(() => {
    if (typedProductData) {
      // Ensure categoryId is a string to match SelectItem values exactly
      const categoryIdValue = typedProductData.category?.id ? String(typedProductData.category.id) : "";

      setFormData({
        name: typedProductData.name,
        slug: typedProductData.slug,
        description: typedProductData.description || "",
        categoryId: categoryIdValue,
        image: typedProductData.image || "",
        bannerImage: typedProductData.bannerImage || "",
        isActive: typedProductData.isActive,
        sortOrder: typedProductData.sortOrder,
      });
      setImagePreview(typedProductData.image || null);
      setBannerPreview(typedProductData.bannerImage || null);
    }
  }, [typedProductData, productId]);

  const updateProductMutation = useUpdateProduct({
    onSuccess: () => {
      toast.success("Product updated successfully");
      setTimeout(() => {
        router.push("/admin/products");
      }, 100);
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Failed to update product");
      setSaving(false);
    },
  });

  const handleImageUpload = async (file: File, type: "image" | "banner") => {
    try {
      if (type === "image") {
        setUploadingImage(true);
      } else {
        setUploadingBanner(true);
      }

      const formDataUpload = new FormData();
      formDataUpload.append("file", file);

      const response = await fetch(`/api/admin/upload?type=products`, {
        method: "POST",
        body: formDataUpload,
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Failed to upload image");
      }

      if (type === "image") {
        setFormData((prev) => ({ ...prev, image: data.data.url }));
        setImagePreview(data.data.url);
      } else {
        setFormData((prev) => ({ ...prev, bannerImage: data.data.url }));
        setBannerPreview(data.data.url);
      }

      toast.success("Image uploaded successfully");
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to upload image"
      );
    } finally {
      if (type === "image") {
        setUploadingImage(false);
      } else {
        setUploadingBanner(false);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name || !formData.slug || !formData.categoryId) {
      toast.error("Name, slug, and category are required");
      return;
    }

    setSaving(true);
    updateProductMutation.mutate(
      { id: productId, data: formData },
      {
        onSettled: () => {
          setSaving(false);
        },
      }
    );
  };

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(price);
  };

  const handleBulkPriceUpdate = async () => {
    if (!typedProductData || !marginPercentage) {
      toast.error("Please enter a margin percentage");
      return;
    }

    // Get all product items for this product
    const itemsData = Array.isArray(productItemsData) ? productItemsData : [];
    const itemsForProduct = itemsData.filter((item: any) => item.product?.id === productId);

    if (itemsForProduct.length === 0) {
      toast.error("No product items found for this product");
      return;
    }

    const margin = parseFloat(marginPercentage) / 100;
    setBulkUpdating(true);

    try {
      const updatePromises = itemsForProduct.map((item: any) => {
        let baseForCalculation = item.basePrice;
        if (priceBase === "normalPrice") {
          baseForCalculation = item.normalPrice;
        }
        const newSellPrice = Math.ceil(baseForCalculation * (1 + margin));

        return fetch(`/api/admin/product-items/${item.id}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            sellPrice: newSellPrice,
          }),
        }).then((res) => {
          if (!res.ok) throw new Error(`Failed to update item ${item.id}`);
          return res.json();
        });
      });

      await Promise.all(updatePromises);
      toast.success(`Successfully updated prices for ${itemsForProduct.length} items with ${marginPercentage}% margin`);
      setMarginPercentage("5");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to update prices"
      );
    } finally {
      setBulkUpdating(false);
    }
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

  if (error || !typedProductData) {
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
              {error instanceof Error ? error.message : "Product not found"}
            </p>
            <Button
              onClick={() => router.push("/admin/products")}
              className="mt-4"
            >
              Back to Products
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
                  <BackButton href="/admin/products" label="Back to Products" />
                  <div>
                    <h1 className="text-3xl font-bold">Edit Product</h1>
                    <p className="mt-2 text-gray-400">
                      Manage product information and view related data
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
                          <Package className="h-5 w-5" />
                          Product Information
                        </CardTitle>
                        <CardDescription>
                          Update product details
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <form onSubmit={handleSubmit} className="space-y-6">
                          {/* Name */}
                          <div className="space-y-2">
                            <Label htmlFor="name" className="flex items-center gap-2">
                              <Package className="h-4 w-4" />
                              Product Name <span className="text-red-400">*</span>
                            </Label>
                            <Input
                              id="name"
                              type="text"
                              value={formData.name}
                              onChange={(e) => {
                                const name = e.target.value;
                                setFormData({
                                  ...formData,
                                  name,
                                  slug: generateSlug(name),
                                });
                              }}
                              required
                              className="bg-gray-800 text-gray-100 border-gray-700"
                            />
                          </div>

                          {/* Slug */}
                          <div className="space-y-2">
                            <Label htmlFor="slug" className="flex items-center gap-2">
                              <Hash className="h-4 w-4" />
                              Slug <span className="text-red-400">*</span>
                            </Label>
                            <Input
                              id="slug"
                              type="text"
                              value={formData.slug}
                              onChange={(e) =>
                                setFormData({ ...formData, slug: e.target.value })
                              }
                              required
                              className="bg-gray-800 text-gray-100 border-gray-700"
                            />
                          </div>

                          {/* Category */}
                          <div className="space-y-2">
                            <Label htmlFor="categoryId" className="flex items-center gap-2">
                              <Package className="h-4 w-4" />
                              Category <span className="text-red-400">*</span>
                            </Label>
                            <Select
                              value={formData.categoryId || undefined}
                              onValueChange={(value) => {
                                // Prevent empty values from being set
                                if (!value?.trim()) return;
                                setFormData({ ...formData, categoryId: value });
                              }}
                              required
                            >
                              <SelectTrigger className="bg-gray-800 text-gray-100 border-gray-700">
                                <SelectValue placeholder="Select category" />
                              </SelectTrigger>
                              <SelectContent className="bg-gray-800 text-gray-100 border-gray-700">
                                {categories.map((cat) => (
                                  <SelectItem key={cat.id} value={String(cat.id)} className="hover:bg-gray-700">
                                    {cat.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>

                          {/* Description */}
                          <div className="space-y-2">
                            <Label htmlFor="description" className="flex items-center gap-2">
                              <FileText className="h-4 w-4" />
                              Description
                            </Label>
                            <Textarea
                              id="description"
                              value={formData.description}
                              onChange={(e) =>
                                setFormData({ ...formData, description: e.target.value })
                              }
                              className="bg-gray-800 text-gray-100 border-gray-700"
                              rows={3}
                            />
                          </div>

                          {/* Image */}
                          <div className="space-y-2">
                            <Label htmlFor="image" className="flex items-center gap-2">
                              <Upload className="h-4 w-4" />
                              Image (for homepage)
                            </Label>
                            <div className="space-y-2">
                              {imagePreview ? (
                                <div className="relative">
                                  <div className="relative h-32 w-full overflow-hidden rounded-md border">
                                    <Image
                                      src={imagePreview}
                                      alt="Preview"
                                      fill
                                      className="object-cover"
                                    />
                                  </div>
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    className="absolute right-2 top-2"
                                    onClick={() => {
                                      setImagePreview(null);
                                      setFormData((prev) => ({ ...prev, image: "" }));
                                    }}
                                  >
                                    <X className="h-4 w-4" />
                                  </Button>
                                </div>
                              ) : (
                                <div className="flex items-center gap-2">
                                  <Input
                                    id="image-file"
                                    type="file"
                                    accept="image/*"
                                    onChange={(e) => {
                                      const file = e.target.files?.[0];
                                      if (file) {
                                        handleImageUpload(file, "image");
                                      }
                                    }}
                                    className="hidden"
                                  />
                                  <Label
                                    htmlFor="image-file"
                                    className="flex cursor-pointer items-center gap-2 rounded-md border border-dashed p-4 hover:bg-gray-800"
                                  >
                                    <Upload className="h-4 w-4" />
                                    <span className="text-sm">
                                      {uploadingImage ? "Uploading..." : "Upload Image"}
                                    </span>
                                  </Label>
                                  <Input
                                    id="image-url"
                                    value={formData.image}
                                    onChange={(e) => {
                                      setFormData({ ...formData, image: e.target.value });
                                      setImagePreview(e.target.value || null);
                                    }}
                                    placeholder="Or enter image URL"
                                    className="flex-1 bg-gray-800 text-gray-100 border-gray-700 placeholder:text-gray-500"
                                  />
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Banner Image */}
                          <div className="space-y-2">
                            <Label htmlFor="bannerImage" className="flex items-center gap-2">
                              <Upload className="h-4 w-4" />
                              Banner Image
                            </Label>
                            <div className="space-y-2">
                              {bannerPreview ? (
                                <div className="relative">
                                  <div className="relative h-32 w-full overflow-hidden rounded-md border">
                                    <Image
                                      src={bannerPreview}
                                      alt="Banner Preview"
                                      fill
                                      className="object-cover"
                                    />
                                  </div>
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    className="absolute right-2 top-2"
                                    onClick={() => {
                                      setBannerPreview(null);
                                      setFormData((prev) => ({ ...prev, bannerImage: "" }));
                                    }}
                                  >
                                    <X className="h-4 w-4" />
                                  </Button>
                                </div>
                              ) : (
                                <div className="flex items-center gap-2">
                                  <Input
                                    id="banner-file"
                                    type="file"
                                    accept="image/*"
                                    onChange={(e) => {
                                      const file = e.target.files?.[0];
                                      if (file) {
                                        handleImageUpload(file, "banner");
                                      }
                                    }}
                                    className="hidden"
                                  />
                                  <Label
                                    htmlFor="banner-file"
                                    className="flex cursor-pointer items-center gap-2 rounded-md border border-dashed p-4 hover:bg-gray-800"
                                  >
                                    <Upload className="h-4 w-4" />
                                    <span className="text-sm">
                                      {uploadingBanner ? "Uploading..." : "Upload Banner"}
                                    </span>
                                  </Label>
                                  <Input
                                    id="banner-url"
                                    value={formData.bannerImage}
                                    onChange={(e) => {
                                      setFormData({ ...formData, bannerImage: e.target.value });
                                      setBannerPreview(e.target.value || null);
                                    }}
                                    placeholder="Or enter banner URL"
                                    className="flex-1 bg-gray-800 text-gray-100 border-gray-700 placeholder:text-gray-500"
                                  />
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Sort Order */}
                          <div className="space-y-2">
                            <Label htmlFor="sortOrder" className="flex items-center gap-2">
                              <ArrowUpDown className="h-4 w-4" />
                              Sort Order
                            </Label>
                            <Input
                              id="sortOrder"
                              type="number"
                              value={formData.sortOrder}
                              onChange={(e) =>
                                setFormData({
                                  ...formData,
                                  sortOrder: parseInt(e.target.value) || 0,
                                })
                              }
                              className="bg-gray-800 text-gray-100 border-gray-700"
                            />
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
                              onClick={() => router.push("/admin/products")}
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
                    {/* Product Stats */}
                    <Card className="bg-gray-900 border-gray-800">
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <ShoppingBag className="h-5 w-5" />
                          Statistics
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-400">Product Items</span>
                          <Badge variant="outline" className="text-sm">
                            {typedProductData._count.items}
                          </Badge>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-400">Status</span>
                          <Badge
                            variant={typedProductData.isActive ? "default" : "secondary"}
                            className={
                              typedProductData.isActive
                                ? "bg-green-600/20 text-green-400"
                                : "bg-gray-600/20 text-gray-400"
                            }
                          >
                            {typedProductData.isActive ? "Active" : "Inactive"}
                          </Badge>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-400">Category</span>
                          <Badge variant="outline" className="text-sm">
                            {typedProductData.category.name}
                          </Badge>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Bulk Price Update */}
                    <Card className="bg-gray-900 border-gray-800">
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Calculator className="h-5 w-5" />
                          Bulk Price Update
                        </CardTitle>
                        <CardDescription>
                          Update all item prices with a fixed margin
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        {typedProductData._count.items > 0 ? (
                          <>
                            {/* Price Base Selection */}
                            <div className="space-y-2">
                              <Label htmlFor="price-base" className="text-xs text-gray-400">
                                Calculate From
                              </Label>
                              <Select
                                value={priceBase}
                                onValueChange={(value) =>
                                  setPriceBase(value as "basePrice" | "normalPrice")
                                }
                              >
                                <SelectTrigger id="price-base" className="bg-gray-800 border-gray-700 text-sm">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent className="bg-gray-800 border-gray-700">
                                  <SelectItem value="basePrice">Base Price</SelectItem>
                                  <SelectItem value="normalPrice">Normal Price</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>

                            {/* Margin Input */}
                            <div className="space-y-2">
                              <Label htmlFor="bulk-margin" className="text-xs text-gray-400">
                                Margin (%)
                              </Label>
                              <Input
                                id="bulk-margin"
                                type="number"
                                min="0"
                                step="0.1"
                                value={marginPercentage}
                                onChange={(e) => setMarginPercentage(e.target.value)}
                                placeholder="5"
                                className="bg-gray-800 border-gray-700 text-sm"
                              />
                              <p className="text-xs text-gray-500">
                                e.g., 5% multiplies price by 1.05
                              </p>
                            </div>

                            <Button
                              onClick={handleBulkPriceUpdate}
                              disabled={bulkUpdating}
                              className="w-full gap-2 bg-blue-600 hover:bg-blue-700 text-sm"
                            >
                              {bulkUpdating && <Loader2 className="h-4 w-4 animate-spin" />}
                              Apply to {typedProductData._count.items} Items
                            </Button>
                          </>
                        ) : (
                          <div className="text-center py-4">
                            <p className="text-sm text-gray-400">
                              No items yet. Add items to use bulk pricing.
                            </p>
                          </div>
                        )}
                      </CardContent>
                    </Card>

                    {/* Product Metadata */}
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
                            {formatDateTime(typedProductData.createdAt)}
                          </p>
                        </div>
                        <div>
                          <span className="text-xs text-gray-400">Updated At</span>
                          <p className="text-sm text-gray-200">
                            {formatDateTime(typedProductData.updatedAt)}
                          </p>
                        </div>
                        <div>
                          <span className="text-xs text-gray-400">Slug</span>
                          <p className="text-sm text-gray-200 font-mono">
                            {typedProductData.slug}
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

