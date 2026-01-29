"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
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
import { Textarea } from "@/components/ui/textarea";
import { DateTimePicker } from "@/components/ui/date-time-picker";
import { useCreateMarketingBanner } from "@/lib/marketing-banners";

export default function MarketingBannerAddPage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    title: "",
    link: "",
    description: "",
    is_active: true,
    sort_order: 0,
    start_date: "",
    end_date: "",
  });

  const createBannerMutation = useCreateMarketingBanner({
    onSuccess: async () => {
      toast.success("Marketing banner created successfully");
      router.push("/admin/marketing-banners");
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Failed to create marketing banner");
      setSaving(false);
    },
  });

  const handleImageChange = (file: File) => {
    setImageFile(file);
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!imageFile) {
      toast.error("Image is required");
      return;
    }

    setSaving(true);
    const submitData: any = {
      title: formData.title || undefined,
      image: imageFile,
      link: formData.link || undefined,
      description: formData.description || undefined,
      is_active: formData.is_active,
      sort_order: formData.sort_order,
      start_date: formData.start_date || null,
      end_date: formData.end_date || null,
    };

    createBannerMutation.mutate(submitData, {
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
                <BackButton href="/admin/marketing-banners" label="Back to Marketing Banners" />
                <div>
                  <h1 className="text-3xl font-bold">Tambah Marketing Banner</h1>
                  <p className="mt-2 text-gray-400">
                    Create a new marketing banner for your store
                  </p>
                </div>
              </div>

              {/* Main Content */}
              <div className="max-w-3xl">
                <Card className="bg-gray-900 border-gray-800">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <ImageIcon className="h-5 w-5" />
                      Marketing Banner Information
                    </CardTitle>
                    <CardDescription>
                      Fill in the details to create a new marketing banner
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
                          placeholder="Banner title"
                          className="bg-gray-800 text-gray-100 border-gray-700 placeholder:text-gray-500"
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
                                />
                              </div>
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="absolute -right-2 -top-2 h-6 w-6 rounded-full bg-red-500 hover:bg-red-600"
                                onClick={() => {
                                  setImagePreview(null);
                                  setImageFile(null);
                                }}
                              >
                                <X className="h-3 w-3 text-white" />
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
                                    handleImageChange(file);
                                  }
                                }}
                                className="file:bg-primary hover:file:bg-primary/90 cursor-pointer border-gray-700 bg-gray-800 text-gray-100 file:mr-4 file:rounded-md file:border-0 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white"
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
                          placeholder="https://example.com"
                          className="bg-gray-800 text-gray-100 border-gray-700 placeholder:text-gray-500"
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
                          placeholder="Banner description"
                          className="bg-gray-800 text-gray-100 border-gray-700 placeholder:text-gray-500"
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
                          value={formData.start_date || undefined}
                          onChange={(value) =>
                            setFormData({ ...formData, start_date: value })
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
                          value={formData.end_date || undefined}
                          onChange={(value) =>
                            setFormData({ ...formData, end_date: value })
                            }
                            placeholder="Select end date and time"
                          />
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
                          onClick={() => router.push("/admin/marketing-banners")}
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
                              Create Banner
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

