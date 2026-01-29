"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Save, Zap, Calendar } from "lucide-react";
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
import { useCreateFlashSale } from "@/lib/flash-sales";
import { DateTimePicker } from "@/components/ui/date-time-picker";
import { localToUTC } from "@/lib/date-utils";

export default function FlashSaleNewPage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    start_time: "" as string | null,
    end_time: "" as string | null,
    is_active: true,
  });

  const createFlashSaleMutation = useCreateFlashSale({
    onSuccess: () => {
      toast.success("Flash sale created successfully");
      router.push("/admin/flash-sales");
    },
    onError: (error) => {
      toast.error(
        error instanceof Error ? error.message : "Failed to create flash sale",
      );
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

    createFlashSaleMutation.mutate(submitData, {
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
                  <BackButton href="/admin/flash-sales" label="Back to Flash Sales" />
                  <div>
                    <h1 className="text-3xl font-bold">Create Flash Sale</h1>
                    <p className="mt-2 text-gray-400">
                      Create a new flash sale event for your products
                    </p>
                  </div>
                </div>

                {/* Main Content */}
                <div className="max-w-2xl">
                  <Card className="bg-gray-900 border-gray-800">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Zap className="h-5 w-5" />
                        Flash Sale Information
                      </CardTitle>
                      <CardDescription>
                        Configure flash sale details and timing
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Name */}
                        <div className="space-y-2">
                          <Label htmlFor="name" className="flex items-center gap-2">
                            <Zap className="h-4 w-4" />
                            Flash Sale Name <span className="text-red-400">*</span>
                          </Label>
                          <Input
                            id="name"
                            type="text"
                            value={formData.name}
                            onChange={(e) =>
                              setFormData({ ...formData, name: e.target.value })
                            }
                            placeholder="e.g., Summer Sale, Weekend Flash"
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

                        <p className="text-xs text-gray-400">
                          Note: Add items to the flash sale from the edit page after creation
                        </p>

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
                                Creating...
                              </>
                            ) : (
                              <>
                                <Save className="mr-2 h-4 w-4" />
                                Create Flash Sale
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

