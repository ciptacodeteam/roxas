"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import Image from "next/image";
import { Loader2, Save, Package, Hash, ArrowUpDown, CheckCircle2, Upload, X, FileText, Calendar, ShoppingBag } from "lucide-react";
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
import { useProduct, useUpdateProduct, type ProductWithItems } from "@/lib/products";
import { useCategories } from "@/lib/categories";
import { useBulkUpdateProductItemPrices } from "@/lib/products";
import { formatDateTime } from "@/lib/date-utils";

export default function ProductEditPage() {
  const router = useRouter();
  const params = useParams();
  const productId = params?.id as string;

  const [saving, setSaving] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [bannerFile, setBannerFile] = useState<File | null>(null);
  const [markupPercentage, setMarkupPercentage] = useState<string>("10");
  const [isApplyingBulkPricing, setIsApplyingBulkPricing] = useState(false);
  const [formData, setFormData] = useState<{
    name: string;
    slug: string;
    description: string;
    category: string;
    is_active: boolean;
    sort_order: number;
  }>({
    name: "",
    slug: "",
    description: "",
    category: "",
    is_active: true,
    sort_order: 0,
  });
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [bannerPreview, setBannerPreview] = useState<string | null>(null);

  // Use React Query to fetch product data
  const { data: productData, isLoading: loading, error } = useProduct(productId, {
    refetchOnMount: true,
    refetchOnWindowFocus: false,
  });

  const { data: categories = [] } = useCategories();

  // Update form data when product data AND categories are loaded
  useEffect(() => {
    if (productData && categories.length > 0) {
      // Extract category ID - handle both object and string formats
      let categoryId = "";
      if (typeof productData.category === 'object' && productData.category !== null) {
        categoryId = String(productData.category.id);
      } else if (typeof productData.category === 'string') {
        categoryId = productData.category;
      }

      console.log('Setting category to:', categoryId);
      console.log('Available categories:', categories.map(c => ({ id: String(c.id), name: c.name })));

      setFormData({
        name: productData.name,
        slug: productData.slug,
        description: productData.description || "",
        category: categoryId,
        is_active: productData.is_active,
        sort_order: productData.sort_order,
      });
      setImagePreview(productData.image || null);
      setBannerPreview(productData.banner_image || null);
    }
  }, [productData, categories]);

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

  const bulkPricingMutation = useBulkUpdateProductItemPrices({
    onSuccess: (data) => {
      toast.success(data.message, {
        description: `Updated ${data.updated_count} items, skipped ${data.skipped_count} items`,
      });
      setIsApplyingBulkPricing(false);
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Failed to update prices");
      setIsApplyingBulkPricing(false);
    },
  });

  const handleBulkPricing = () => {
    const percentage = parseFloat(markupPercentage);
    
    if (isNaN(percentage)) {
      toast.error("Please enter a valid percentage");
      return;
    }

    if (percentage < -100 || percentage > 1000) {
      toast.error("Percentage must be between -100 and 1000");
      return;
    }

    setIsApplyingBulkPricing(true);
    bulkPricingMutation.mutate({
      productId,
      data: {
        markup_percentage: percentage,
        apply_to_all: true,
      },
    });
  };

  const handleImageChange = (file: File, type: "image" | "banner") => {
    if (type === "image") {
      setImageFile(file);
    } else {
      setBannerFile(file);
    }
    const reader = new FileReader();
    reader.onloadend = () => {
      if (type === "image") {
        setImagePreview(reader.result as string);
      } else {
        setBannerPreview(reader.result as string);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name || !formData.slug || !formData.category) {
      toast.error("Name, slug, and category are required");
      return;
    }

    setSaving(true);
    const submitData: any = {
      name: formData.name,
      slug: formData.slug,
      description: formData.description,
      category_id: formData.category,  // Send as category_id for backend
      is_active: formData.is_active,
      sort_order: formData.sort_order,
    };

    // Only include files if they were changed
    if (imageFile) submitData.image = imageFile;
    if (bannerFile) submitData.banner_image = bannerFile;

    updateProductMutation.mutate(
      { id: productId, data: submitData },
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

  if (error || !productData) {
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
                            <Label htmlFor="category" className="flex items-center gap-2">
                              <Package className="h-4 w-4" />
                              Category <span className="text-red-400">*</span>
                            </Label>
                            {formData.category && categories.length > 0 ? (
                              <Select
                                key={productId}
                                value={formData.category}
                                onValueChange={(value) => {
                                  console.log('Category selected:', value);
                                  setFormData({ ...formData, category: value });
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
                            ) : (
                              <div className="h-10 bg-gray-800 border border-gray-700 rounded-md flex items-center px-3">
                                <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
                              </div>
                            )}
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
                                      setImageFile(null);
                                    }}
                                  >
                                    <X className="h-4 w-4" />
                                  </Button>
                                </div>
                              ) : (
                                <div>
                                  <Input
                                    id="image-file"
                                    type="file"
                                    accept="image/*"
                                    onChange={(e) => {
                                      const file = e.target.files?.[0];
                                      if (file) {
                                        handleImageChange(file, "image");
                                      }
                                    }}
                                    className="file:bg-primary hover:file:bg-primary/90 cursor-pointer border-gray-700 bg-gray-800 text-gray-100 file:mr-4 file:rounded-md file:border-0 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white"
                                  />
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Banner Image */}
                          <div className="space-y-2">
                            <Label htmlFor="banner_image" className="flex items-center gap-2">
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
                                      setBannerFile(null);
                                    }}
                                  >
                                    <X className="h-4 w-4" />
                                  </Button>
                                </div>
                              ) : (
                                <div>
                                  <Input
                                    id="banner-file"
                                    type="file"
                                    accept="image/*"
                                    onChange={(e) => {
                                      const file = e.target.files?.[0];
                                      if (file) {
                                        handleImageChange(file, "banner");
                                      }
                                    }}
                                    className="file:bg-primary hover:file:bg-primary/90 cursor-pointer border-gray-700 bg-gray-800 text-gray-100 file:mr-4 file:rounded-md file:border-0 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white"
                                  />
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Sort Order */}
                          <div className="space-y-2">
                            <Label htmlFor="sort_order" className="flex items-center gap-2">
                              <ArrowUpDown className="h-4 w-4" />
                              Sort Order
                            </Label>
                            <Input
                              id="sort_order"
                              type="number"
                              value={formData.sort_order}
                              onChange={(e) =>
                                setFormData({
                                  ...formData,
                                  sort_order: parseInt(e.target.value) || 0,
                                })
                              }
                              className="bg-gray-800 text-gray-100 border-gray-700"
                            />
                          </div>

                          {/* Active Status */}
                          <div className="flex items-center space-x-2">
                            <Checkbox
                              id="is_active"
                              checked={formData.is_active}
                              onCheckedChange={(checked) =>
                                setFormData({
                                  ...formData,
                                  is_active: !!checked,
                                })
                              }
                            />
                            <Label htmlFor="is_active" className="cursor-pointer flex items-center gap-2">
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
                            {productData.items?.length || 0}
                          </Badge>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-400">Status</span>
                          <Badge
                            variant={productData.is_active ? "default" : "secondary"}
                            className={
                              productData.is_active
                                ? "bg-green-600/20 text-green-400"
                                : "bg-gray-600/20 text-gray-400"
                            }
                          >
                            {productData.is_active ? "Active" : "Inactive"}
                          </Badge>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-400">Category</span>
                          <Badge variant="outline" className="text-sm">
                            {productData.category_name}
                          </Badge>
                        </div>
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
                            {formatDateTime(productData.created_at)}
                          </p>
                        </div>
                        <div>
                          <span className="text-xs text-gray-400">Updated At</span>
                          <p className="text-sm text-gray-200">
                            {formatDateTime(productData.updated_at)}
                          </p>
                        </div>
                        <div>
                          <span className="text-xs text-gray-400">Slug</span>
                          <p className="text-sm text-gray-200 font-mono">
                            {productData.slug}
                          </p>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Bulk Price Update */}
                    {productData.items && productData.items.length > 0 && (
                      <Card className="bg-gray-900 border-gray-800">
                        <CardHeader>
                          <CardTitle className="flex items-center gap-2">
                            <Package className="h-5 w-5" />
                            Bulk Price Update
                          </CardTitle>
                          <CardDescription>
                            Update sell prices for all product items based on base price
                          </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <div className="space-y-2">
                            <Label htmlFor="markup_percentage" className="text-sm">
                              Markup Percentage
                            </Label>
                            <Input
                              id="markup_percentage"
                              type="number"
                              step="0.1"
                              value={markupPercentage}
                              onChange={(e) => setMarkupPercentage(e.target.value)}
                              placeholder="e.g., 10 for 10% markup"
                              className="bg-gray-800 text-gray-100 border-gray-700"
                              disabled={isApplyingBulkPricing}
                            />
                            <p className="text-xs text-gray-400">
                              Positive value for markup, negative for discount
                            </p>
                          </div>

                          <div className="rounded-md bg-blue-950/30 border border-blue-800/50 p-3">
                            <p className="text-xs text-blue-200">
                              <strong>Example:</strong> With 10% markup, an item with base price of
                              Rp 10,000 will have a sell price of Rp 11,000
                            </p>
                          </div>

                          <Button
                            onClick={handleBulkPricing}
                            disabled={isApplyingBulkPricing || !markupPercentage}
                            className="w-full"
                            variant="default"
                          >
                            {isApplyingBulkPricing ? (
                              <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Updating Prices...
                              </>
                            ) : (
                              <>
                                <Package className="mr-2 h-4 w-4" />
                                Apply to All Items ({productData.items.length})
                              </>
                            )}
                          </Button>

                          <div className="rounded-md bg-yellow-950/30 border border-yellow-800/50 p-3">
                            <p className="text-xs text-yellow-200">
                              <strong>Note:</strong> This will update all product items that have a
                              base price. Items without base price will be skipped.
                            </p>
                          </div>
                        </CardContent>
                      </Card>
                    )}
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

