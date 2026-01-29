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
import { useCreateProduct } from "@/lib/products";
import { useCategories } from "@/lib/categories";

export default function ProductAddPage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [bannerFile, setBannerFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [bannerPreview, setBannerPreview] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    slug: "",
    description: "",
    category: "",
    is_active: true,
    sort_order: 0,
    input_fields: [] as any[],
    instructions: "",
  });

  const { data: categories = [] } = useCategories();

  useEffect(() => {
    if (categories.length > 0 && !formData.category) {
      setFormData((prev) => ({ ...prev, category: categories[0].id }));
    }
  }, [categories, formData.category]);

  const createProductMutation = useCreateProduct({
    onSuccess: () => {
      toast.success("Product created successfully");
      setTimeout(() => {
        router.push("/admin/products");
      }, 100);
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Failed to create product");
      setSaving(false);
    },
  });

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
      ...formData,
      image: imageFile || undefined,
      banner_image: bannerFile || undefined,
    };

    createProductMutation.mutate(submitData, {
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
                          <Label htmlFor="category" className="flex items-center gap-2">
                            <Package className="h-4 w-4" />
                            Category <span className="text-red-400">*</span>
                          </Label>
                          <Select
                            value={formData.category}
                            onValueChange={(value) =>
                              setFormData({ ...formData, category: value })
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

