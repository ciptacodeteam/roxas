"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import Image from "next/image";
import { Loader2, Save, ImageIcon, Link as LinkIcon, FileText, ArrowUpDown, CheckCircle2, Upload, X, Calendar } from "lucide-react";
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
import { Textarea } from "@/components/ui/textarea";
import { DateTimePicker } from "@/components/ui/date-time-picker";
import { useAdminMarketingBanner, useUpdateMarketingBanner } from "@/lib/queries";
import { formatDateTime } from "@/lib/date-utils";

interface MarketingBannerDetail {
  id: string;
  title: string | null;
  image: string;
  link: string | null;
  description: string | null;
  isActive: boolean;
  sortOrder: number;
  startDate: string | null;
  endDate: string | null;
  createdAt: string;
  updatedAt: string;
}

export default function MarketingBannerEditPage() {
  const router = useRouter();
  const params = useParams();
  const bannerId = params?.id as string;

  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState<{
    title: string;
    image: string;
    link: string;
    description: string;
    isActive: boolean;
    sortOrder: number;
    startDate: string;
    endDate: string;
  }>({
    title: "",
    image: "",
    link: "",
    description: "",
    isActive: true,
    sortOrder: 0,
    startDate: "",
    endDate: "",
  });
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);

  // Use React Query to fetch banner data
  const { data: bannerData, isLoading: loading, error } = useAdminMarketingBanner(bannerId);
  const typedBannerData = bannerData as MarketingBannerDetail | null | undefined;

  // Update form data when banner data changes
  useEffect(() => {
    if (typedBannerData) {
      setFormData({
        title: typedBannerData.title || "",
        image: typedBannerData.image,
        link: typedBannerData.link || "",
        description: typedBannerData.description || "",
        isActive: typedBannerData.isActive,
        sortOrder: typedBannerData.sortOrder,
        startDate: typedBannerData.startDate ? new Date(typedBannerData.startDate).toISOString().slice(0, 16) : "",
        endDate: typedBannerData.endDate ? new Date(typedBannerData.endDate).toISOString().slice(0, 16) : "",
      });
      setImagePreview(typedBannerData.image);
    }
  }, [typedBannerData]);

  const updateBannerMutation = useUpdateMarketingBanner({
    onSuccess: () => {
      toast.success("Marketing banner updated successfully");
      setTimeout(() => {
        router.push("/admin/marketing-banners");
      }, 500);
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Failed to update marketing banner");
      setSaving(false);
    },
  });

  const handleImageUpload = async (file: File) => {
    try {
      setUploadingImage(true);

      const formDataUpload = new FormData();
      formDataUpload.append("file", file);

      const response = await fetch(`/api/admin/upload?type=banners`, {
        method: "POST",
        body: formDataUpload,
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Failed to upload image");
      }

      setFormData((prev) => ({ ...prev, image: data.data.url }));
      setImagePreview(data.data.url);

      toast.success("Image uploaded successfully");
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to upload image"
      );
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.image) {
      toast.error("Image is required");
      return;
    }

    setSaving(true);
    const submitData = {
      title: formData.title || null,
      image: formData.image,
      link: formData.link || null,
      description: formData.description || null,
      isActive: formData.isActive,
      sortOrder: formData.sortOrder,
      startDate: formData.startDate || null,
      endDate: formData.endDate || null,
    };

    updateBannerMutation.mutate(
      { id: bannerId, data: submitData },
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

  if (error || !typedBannerData) {
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
              {error instanceof Error ? error.message : "Marketing banner not found"}
            </p>
            <Button
              onClick={() => router.push("/admin/marketing-banners")}
              className="mt-4"
            >
              Back to Marketing Banners
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
                <BackButton href="/admin/marketing-banners" label="Back to Marketing Banners" />
                <div>
                  <h1 className="text-3xl font-bold">Edit Marketing Banner</h1>
                  <p className="mt-2 text-gray-400">
                    Manage marketing banner information and view related data
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
                        <ImageIcon className="h-5 w-5" />
                        Marketing Banner Information
                      </CardTitle>
                      <CardDescription>
                        Update marketing banner details
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Title */}
                        <div className="space-y-2">
                          <Label htmlFor="title" className="flex items-center gap-2">
                            <FileText className="h-4 w-4" />
                            Title (Optional)
                          </Label>
                          <Input
                            id="title"
                            type="text"
                            value={formData.title}
                            onChange={(e) =>
                              setFormData({ ...formData, title: e.target.value })
                            }
                            className="bg-gray-800 text-gray-100 border-gray-700"
                          />
                        </div>

                        {/* Image */}
                        <div className="space-y-2">
                          <Label htmlFor="image" className="flex items-center gap-2">
                            <ImageIcon className="h-4 w-4" />
                            Image <span className="text-red-400">*</span>
                          </Label>
                          <div className="space-y-2">
                            {imagePreview ? (
                              <div className="relative">
                                <div className="relative h-48 w-full overflow-hidden rounded-md border border-gray-700">
                                  <Image
                                    src={imagePreview}
                                    alt="Preview"
                                    fill
                                    className="object-contain"
                                    onError={() => setImagePreview(null)}
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
                                      handleImageUpload(file);
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

                        {/* Link */}
                        <div className="space-y-2">
                          <Label htmlFor="link" className="flex items-center gap-2">
                            <LinkIcon className="h-4 w-4" />
                            Link (Optional)
                          </Label>
                          <Input
                            id="link"
                            type="url"
                            value={formData.link}
                            onChange={(e) =>
                              setFormData({ ...formData, link: e.target.value })
                            }
                            className="bg-gray-800 text-gray-100 border-gray-700"
                          />
                        </div>

                        {/* Description */}
                        <div className="space-y-2">
                          <Label htmlFor="description" className="flex items-center gap-2">
                            <FileText className="h-4 w-4" />
                            Description (Optional)
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

                        {/* Date Range */}
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="startDate" className="flex items-center gap-2">
                              <Calendar className="h-4 w-4" />
                              Start Date (Optional)
                            </Label>
                            <DateTimePicker
                              value={formData.startDate || undefined}
                              onChange={(value) =>
                                setFormData({ ...formData, startDate: value })
                              }
                              placeholder="Select start date and time"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="endDate" className="flex items-center gap-2">
                              <Calendar className="h-4 w-4" />
                              End Date (Optional)
                            </Label>
                            <DateTimePicker
                              value={formData.endDate || undefined}
                              onChange={(value) =>
                                setFormData({ ...formData, endDate: value })
                              }
                              placeholder="Select end date and time"
                            />
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
                            onClick={() => router.push("/admin/marketing-banners")}
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
                  {/* Banner Status */}
                  <Card className="bg-gray-900 border-gray-800">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <ImageIcon className="h-5 w-5" />
                        Status
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-400">Status</span>
                        <Badge
                          variant={typedBannerData.isActive ? "default" : "secondary"}
                          className={
                            typedBannerData.isActive
                              ? "bg-green-600/20 text-green-400"
                              : "bg-gray-600/20 text-gray-400"
                          }
                        >
                          {typedBannerData.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </div>
                      {typedBannerData.startDate && (
                        <div>
                          <span className="text-xs text-gray-400">Start Date</span>
                          <p className="text-sm text-gray-200">
                            {formatDateTime(typedBannerData.startDate)}
                          </p>
                        </div>
                      )}
                      {typedBannerData.endDate && (
                        <div>
                          <span className="text-xs text-gray-400">End Date</span>
                          <p className="text-sm text-gray-200">
                            {formatDateTime(typedBannerData.endDate)}
                          </p>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* Banner Metadata */}
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
                          {formatDateTime(typedBannerData.createdAt)}
                        </p>
                      </div>
                      <div>
                        <span className="text-xs text-gray-400">Updated At</span>
                        <p className="text-sm text-gray-200">
                          {formatDateTime(typedBannerData.updatedAt)}
                        </p>
                      </div>
                      {typedBannerData.link && (
                        <div>
                          <span className="text-xs text-gray-400">Link</span>
                          <p className="text-sm text-gray-200 break-all">
                            <a
                              href={typedBannerData.link}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-400 hover:underline"
                            >
                              {typedBannerData.link}
                            </a>
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

