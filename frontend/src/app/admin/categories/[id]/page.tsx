"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { Loader2, Save, Tag, Hash, ArrowUpDown, CheckCircle2, Package, Calendar } from "lucide-react";
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
import { useCategory, useUpdateCategory, type CategoryWithCount } from "@/lib/categories";
import { formatDateTime } from "@/lib/date-utils";

export default function CategoryEditPage() {
  const router = useRouter();
  const params = useParams();
  const categoryId = params?.id as string;

  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState<{
    name: string;
    slug: string;
    is_active: boolean;
    sort_order: number;
  }>({
    name: "",
    slug: "",
    is_active: true,
    sort_order: 0,
  });

  // Use React Query to fetch category data
  const { data: categoryData, isLoading: loading, error } = useCategory(categoryId, {
    refetchOnMount: "always",
    refetchOnWindowFocus: true,
    staleTime: 0,
  });
  const typedCategoryData = categoryData as CategoryWithCount | null | undefined;

  // Update form data when category data changes
  useEffect(() => {
    if (typedCategoryData) {
      setFormData({
        name: typedCategoryData.name,
        slug: typedCategoryData.slug,
        is_active: typedCategoryData.is_active,
        sort_order: typedCategoryData.sort_order,
      });
    }
  }, [typedCategoryData, categoryId]);

  const updateCategoryMutation = useUpdateCategory({
    onSuccess: () => {
      toast.success("Category updated successfully");
      setTimeout(() => {
        router.push("/admin/categories");
      }, 100);
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Failed to update category");
      setSaving(false);
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name || !formData.slug) {
      toast.error("Name and slug are required");
      return;
    }

    setSaving(true);
    updateCategoryMutation.mutate(
      { id: categoryId, data: formData },
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

  if (error || !typedCategoryData) {
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
              {error instanceof Error ? error.message : "Category not found"}
            </p>
            <Button
              onClick={() => router.push("/admin/categories")}
              className="mt-4"
            >
              Back to Categories
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
                  <BackButton href="/admin/categories" label="Back to Categories" />
                  <div>
                    <h1 className="text-3xl font-bold">Edit Category</h1>
                    <p className="mt-2 text-gray-400">
                      Manage category information and view related data
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
                          Category Information
                        </CardTitle>
                        <CardDescription>
                          Update category details
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <form onSubmit={handleSubmit} className="space-y-6">
                          {/* Name */}
                          <div className="space-y-2">
                            <Label htmlFor="name" className="flex items-center gap-2">
                              <Tag className="h-4 w-4" />
                              Category Name <span className="text-red-400">*</span>
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

                          {/* Sort Order */}
                          <div className="space-y-2">
                            <Label htmlFor="sortOrder" className="flex items-center gap-2">
                              <ArrowUpDown className="h-4 w-4" />
                              Sort Order
                            </Label>
                            <Input
                              id="sortOrder"
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
                              id="isActive"
                              checked={formData.is_active}
                              onCheckedChange={(checked) =>
                                setFormData({
                                  ...formData,
                                  is_active: !!checked,
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
                              onClick={() => router.push("/admin/categories")}
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
                    {/* Category Stats */}
                    <Card className="bg-gray-900 border-gray-800">
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Package className="h-5 w-5" />
                          Statistics
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-400">Total Products</span>
                          <Badge variant="outline" className="text-sm">
                            {typedCategoryData.product_count}
                          </Badge>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-400">Status</span>
                          <Badge
                            variant={typedCategoryData.is_active ? "default" : "secondary"}
                            className={
                              typedCategoryData.is_active
                                ? "bg-green-600/20 text-green-400"
                                : "bg-gray-600/20 text-gray-400"
                            }
                          >
                            {typedCategoryData.is_active ? "Active" : "Inactive"}
                          </Badge>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Category Metadata */}
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
                            {formatDateTime(typedCategoryData.created_at)}
                          </p>
                        </div>
                        <div>
                          <span className="text-xs text-gray-400">Updated At</span>
                          <p className="text-sm text-gray-200">
                            {formatDateTime(typedCategoryData.updated_at)}
                          </p>
                        </div>
                        <div>
                          <span className="text-xs text-gray-400">Slug</span>
                          <p className="text-sm text-gray-200 font-mono">
                            {typedCategoryData.slug}
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

