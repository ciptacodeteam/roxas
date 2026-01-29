"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { Loader2, Save, Zap, Calendar, Plus, Trash2, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { BackButton } from "@/components/admin/back-button";
import { AppSidebar } from "@/components/app-sidebar";
import { AdminHeader } from "@/components/admin-header";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { toast } from "sonner";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { DateTimePicker } from "@/components/ui/date-time-picker";
import { useFlashSale, useUpdateFlashSale, useFlashSaleItems, useCreateFlashSaleItem, useDeleteFlashSaleItem } from "@/lib/flash-sales";
import { formatDateTime, utcToLocal, localToUTC } from "@/lib/date-utils";

export default function FlashSaleEditPage() {
  const router = useRouter();
  const params = useParams();
  const flashSaleId = params?.id as string;

  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    start_time: "" as string | null,
    end_time: "" as string | null,
    is_active: true,
  });

  const { data: flashSaleData, isLoading: loading, error, refetch } = useFlashSale(flashSaleId, {
    refetchOnMount: 'always',
    refetchOnWindowFocus: true,
    staleTime: 0,
  });

  useEffect(() => {
    if (flashSaleData) {
      setFormData({
        name: flashSaleData.name,
        start_time: utcToLocal(flashSaleData.start_time),
        end_time: utcToLocal(flashSaleData.end_time),
        is_active: flashSaleData.is_active,
      });
    }
  }, [flashSaleData]);

  const updateFlashSaleMutation = useUpdateFlashSale({
    onSuccess: async () => {
      toast.success("Flash sale updated successfully");
      await refetch();
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Failed to update flash sale");
      setSaving(false);
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name || !formData.start_time || !formData.end_time) {
      toast.error("Name, start time, and end time are required");
      return;
    }

    if (new Date(formData.end_time) <= new Date(formData.start_time)) {
      toast.error("End time must be after start time");
      return;
    }

    setSaving(true);
    const submitData = {
      name: formData.name.trim(),
      start_time: localToUTC(formData.start_time!),
      end_time: localToUTC(formData.end_time!),
      is_active: formData.is_active,
    };

    updateFlashSaleMutation.mutate(
      { id: flashSaleId, data: submitData },
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
            <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
          </div>
        </SidebarInset>
      </SidebarProvider>
    );
  }

  if (error || !flashSaleData) {
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
              {error instanceof Error ? error.message : "Flash sale not found"}
            </p>
            <Button
              onClick={() => router.push("/admin/flash-sales")}
              className="mt-4"
            >
              Back to Flash Sales
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
                  <BackButton href="/admin/flash-sales" label="Back to Flash Sales" />
                  <div>
                    <h1 className="text-3xl font-bold">Edit Flash Sale</h1>
                    <p className="mt-2 text-gray-400">
                      Manage flash sale information and items
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
                          <Zap className="h-5 w-5" />
                          Flash Sale Information
                        </CardTitle>
                        <CardDescription>
                          Update flash sale details
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <form onSubmit={handleSubmit} className="space-y-6">
                          {/* Name */}
                          <div className="space-y-2">
                            <Label htmlFor="name" className="flex items-center gap-2">
                              <Zap className="h-4 w-4" />
                              Name <span className="text-red-400">*</span>
                            </Label>
                            <Input
                              id="name"
                              type="text"
                              value={formData.name}
                              onChange={(e) =>
                                setFormData({ ...formData, name: e.target.value })
                              }
                              maxLength={200}
                            />
                            <p className="text-xs text-gray-400">{formData.name.length}/200</p>
                          </div>

                          {/* Date Range */}
                          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                            <div className="space-y-2">
                              <Label htmlFor="start_time" className="flex items-center gap-2">
                                <Calendar className="h-4 w-4" />
                                Start Time <span className="text-red-400">*</span>
                              </Label>
                              <DateTimePicker
                                value={formData.start_time || undefined}
                                onChange={(value) =>
                                  setFormData({ ...formData, start_time: value })
                                }
                                placeholder="Select start date and time"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="end_time" className="flex items-center gap-2">
                                <Calendar className="h-4 w-4" />
                                End Time <span className="text-red-400">*</span>
                              </Label>
                              <DateTimePicker
                                value={formData.end_time || undefined}
                                onChange={(value) =>
                                  setFormData({ ...formData, end_time: value })
                                }
                                placeholder="Select end date and time"
                              />
                            </div>
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
                            <Label htmlFor="is_active" className="cursor-pointer">
                              Active (visible to users)
                            </Label>
                          </div>

                          <Separator className="bg-gray-700" />

                          {/* Submit Button */}
                          <div className="flex justify-end gap-3">
                            <Button
                              type="button"
                              variant="outline"
                              onClick={() => router.push("/admin/flash-sales")}
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

                    {/* Flash Sale Items */}
                    <FlashSaleItemsSection flashSaleId={flashSaleId} />
                  </div>

                  {/* Right Column - Flash Sale Metadata */}
                  <div className="space-y-6">
                    <Card className="bg-gray-900 border-gray-800">
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Zap className="h-5 w-5" />
                          Status
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-400">Status</span>
                          <Badge
                            variant={flashSaleData.is_active_now ? "default" : "secondary"}
                          >
                            {flashSaleData.is_active_now ? "Active Now" : flashSaleData.is_active ? "Scheduled" : "Inactive"}
                          </Badge>
                        </div>
                        <div>
                          <span className="text-xs text-gray-400">Start Time</span>
                          <p className="text-sm text-gray-200">
                            {formatDateTime(flashSaleData.start_time)}
                          </p>
                        </div>
                        <div>
                          <span className="text-xs text-gray-400">End Time</span>
                          <p className="text-sm text-gray-200">
                            {formatDateTime(flashSaleData.end_time)}
                          </p>
                        </div>
                        <div>
                          <span className="text-xs text-gray-400">Items Count</span>
                          <p className="text-sm text-gray-200">
                            {flashSaleData.items.length} items
                          </p>
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="bg-gray-900 border-gray-800">
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Calendar className="h-5 w-5" />
                          Metadata
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div>
                          <span className="text-xs text-gray-400">Created</span>
                          <p className="text-sm text-gray-200">
                            {formatDateTime(flashSaleData.created_at)}
                          </p>
                        </div>
                        <div>
                          <span className="text-xs text-gray-400">Updated</span>
                          <p className="text-sm text-gray-200">
                            {formatDateTime(flashSaleData.updated_at)}
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

// Flash Sale Items Section Component
function FlashSaleItemsSection({ flashSaleId }: { flashSaleId: string }) {
  const { data: items = [], isLoading, refetch } = useFlashSaleItems(flashSaleId);
  const deleteItemMutation = useDeleteFlashSaleItem(flashSaleId, {
    onSuccess: async () => {
      toast.success("Item removed from flash sale");
      await refetch();
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Failed to remove item");
    },
  });

  const handleDelete = (itemId: string) => {
    if (confirm("Are you sure you want to remove this item?")) {
      deleteItemMutation.mutate(itemId);
    }
  };

  return (
    <Card className="bg-gray-900 border-gray-800 mt-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Plus className="h-5 w-5" />
          Flash Sale Items ({items.length})
        </CardTitle>
        <CardDescription>
          Products included in this flash sale
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        ) : items.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-8">
            No items in this flash sale yet. Add items from the product management section.
          </p>
        ) : (
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {items.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between p-3 border border-gray-700 rounded-md"
              >
                <div className="flex-1">
                  <p className="font-medium text-sm">{item.product_item_name}</p>
                  <p className="text-xs text-gray-400">{item.product_name}</p>
                  <div className="flex gap-4 mt-2 text-xs">
                    <span>Sale: Rp {item.sale_price.toLocaleString('id-ID')}</span>
                    <span>Normal: Rp {item.normal_price.toLocaleString('id-ID')}</span>
                    <span className="text-green-400">{item.discount_percentage}% off</span>
                    <span>Stock: {item.stock}</span>
                    <span>Sold: {item.sold_count}</span>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-red-500 hover:text-red-600"
                  onClick={() => handleDelete(item.id)}
                  disabled={deleteItemMutation.isPending}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

