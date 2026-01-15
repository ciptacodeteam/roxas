"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import Image from "next/image";
import { Loader2, Save, Package, Hash, ArrowUpDown, CheckCircle2, Upload, X, FileText } from "lucide-react";
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
import { Textarea } from "@/components/ui/textarea";
import { useCreateProduct, useAdminCategories } from "@/lib/queries";

export default function ProductAddPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    slug: "",
    description: "",
    categoryId: "",
    image: "",
    bannerImage: "",
    isActive: true,
    sortOrder: 0,
    inputFields: [] as any[],
  });
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [bannerPreview, setBannerPreview] = useState<string | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadingBanner, setUploadingBanner] = useState(false);

  const { data: categories = [] } = useAdminCategories();

  useEffect(() => {
    if (categories.length > 0 && !formData.categoryId) {
      setFormData((prev) => ({ ...prev, categoryId: categories[0].id }));
    }
  }, [categories]);

  const createProductMutation = useCreateProduct({
    onSuccess: async () => {
      // Ensure queries are invalidated and refetched
      await queryClient.invalidateQueries({ queryKey: ["admin", "products"] });
      await queryClient.refetchQueries({ queryKey: ["admin", "products"] });
      toast.success("Product created successfully");
      router.push("/admin/products");
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Failed to create product");
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
    createProductMutation.mutate(formData, {
      onSettled: () => {
        setSaving(false);
      },
    });
  };

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");
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
                <BackButton href="/admin/products" label="Back to Products" />
                <div>
                  <h1 className="text-3xl font-bold">Tambah Produk</h1>
                  <p className="mt-2 text-gray-400">
                    Create a new product for your store
                  </p>
                </div>
              </div>

              {/* Main Content */}
              <div className="max-w-3xl">
                <Card className="bg-gray-900 border-gray-800">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Package className="h-5 w-5" />
                      Product Information
                    </CardTitle>
                    <CardDescription>
                      Fill in the details to create a new product
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
                          placeholder="e.g. Mobile Legends"
                          className="bg-gray-800 text-gray-100 border-gray-700 placeholder:text-gray-500"
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
                          placeholder="e.g. mobile-legends"
                          className="bg-gray-800 text-gray-100 border-gray-700 placeholder:text-gray-500"
                        />
                      </div>

                      {/* Category */}
                      <div className="space-y-2">
                        <Label htmlFor="categoryId" className="flex items-center gap-2">
                          <Package className="h-4 w-4" />
                          Category <span className="text-red-400">*</span>
                        </Label>
                        <Select
                          value={formData.categoryId}
                          onValueChange={(value) =>
                            setFormData({ ...formData, categoryId: value })
                          }
                          required
                        >
                          <SelectTrigger className="bg-gray-800 text-gray-100 border-gray-700">
                            <SelectValue placeholder="Select category" />
                          </SelectTrigger>
                          <SelectContent className="bg-gray-800 text-gray-100 border-gray-700">
                            {categories.map((cat) => (
                              <SelectItem key={cat.id} value={cat.id}>
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
                          placeholder="Optional product description"
                          className="bg-gray-800 text-gray-100 border-gray-700 placeholder:text-gray-500"
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
                          placeholder="0"
                          className="bg-gray-800 text-gray-100 border-gray-700 placeholder:text-gray-500"
                        />
                        <p className="text-xs text-gray-400">
                          Lower numbers appear first in listings
                        </p>
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
                              Creating...
                            </>
                          ) : (
                            <>
                              <Save className="mr-2 h-4 w-4" />
                              Create Product
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

