"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Save, Tag, Hash, ArrowUpDown, CheckCircle2 } from "lucide-react";
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
import { useCreateCategory, categoriesQueryKeys } from "@/lib/categories";

export default function CategoryAddPage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    slug: "",
    is_active: true,
    sort_order: 0,
  });

  const createCategoryMutation = useCreateCategory({
    onSuccess: async () => {
      toast.success("Category created successfully");
      setTimeout(() => {
        router.push("/admin/categories");
      }, 100);
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Failed to create category");
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
    createCategoryMutation.mutate(formData, {
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
                  <BackButton href="/admin/categories" label="Back to Categories" />
                  <div>
                    <h1 className="text-3xl font-bold">Tambah Kategori</h1>
                    <p className="mt-2 text-gray-400">
                      Create a new category for your products
                    </p>
                  </div>
                </div>

                {/* Main Content */}
                <div className="max-w-2xl">
                  <Card className="bg-gray-900 border-gray-800">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Tag className="h-5 w-5" />
                        Category Information
                      </CardTitle>
                      <CardDescription>
                        Fill in the details to create a new category
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
                            placeholder="e.g. Games, Pulsa"
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
                            placeholder="e.g. games, pulsa"
                            className="bg-gray-800 text-gray-100 border-gray-700 placeholder:text-gray-500"
                          />
                          <p className="text-xs text-gray-400">
                            URL-friendly identifier (auto-generated from name)
                          </p>
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
                                Creating...
                              </>
                            ) : (
                              <>
                                <Save className="mr-2 h-4 w-4" />
                                Create Category
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

