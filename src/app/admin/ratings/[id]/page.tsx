"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { Loader2, Save, Star } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { BackButton } from "@/components/admin/back-button";
import { AppSidebar } from "@/components/app-sidebar";
import { AdminHeader } from "@/components/admin-header";
import {
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAdminRating, useUpdateRating, useAdminProducts } from "@/lib/queries";

export default function RatingEditPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const [saving, setSaving] = useState(false);
  const { data: products = [] } = useAdminProducts();
  const { data: ratingData, isLoading: loading } = useAdminRating(id);
  const [formData, setFormData] = useState({
    productId: "",
    rating: 5,
    comment: "",
    userName: "",
    isActive: true,
    sortOrder: 0,
  });

  useEffect(() => {
    if (ratingData) {
      // Ensure productId is a string to match SelectItem values exactly
      const productIdValue = ratingData.productId ? String(ratingData.productId) : "";
      
      setFormData({
        productId: productIdValue,
        rating: ratingData.rating || 5,
        comment: ratingData.comment || "",
        userName: ratingData.userName || "",
        isActive: ratingData.isActive ?? true,
        sortOrder: ratingData.sortOrder || 0,
      });
    }
  }, [ratingData]);

  const updateRatingMutation = useUpdateRating({
    onSuccess: () => {
      toast.success("Rating updated successfully");
      router.push("/admin/ratings");
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Failed to update rating");
      setSaving(false);
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.productId || !formData.rating) {
      toast.error("Product and rating are required");
      return;
    }

    if (formData.rating < 1 || formData.rating > 5) {
      toast.error("Rating must be between 1 and 5");
      return;
    }

    setSaving(true);
    const submitData = {
      ...formData,
      comment: formData.comment || null,
      userName: formData.userName || null,
      rating: parseInt(formData.rating.toString()),
      sortOrder: parseInt(formData.sortOrder.toString()),
    };

    updateRatingMutation.mutate(
      { id, data: submitData },
      {
        onSettled: () => {
          setSaving(false);
        },
      }
    );
  };

  if (loading) {
    return (
      <SidebarProvider>
        <AppSidebar variant="inset" />
        <SidebarInset>
          <AdminHeader />
          <div className="flex items-center justify-center h-screen">
            <Loader2 className="h-8 w-8 animate-spin" />
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
                <BackButton href="/admin/ratings" />
                <div className="mt-6">
                  <Card className="bg-gray-900 border-gray-800">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Star className="h-5 w-5" />
                        Edit Rating
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="space-y-2">
                          <Label htmlFor="productId" className="flex items-center gap-2">
                            Product <span className="text-red-400">*</span>
                          </Label>
                          <Select
                            value={formData.productId || undefined}
                            onValueChange={(value) => {
                              if (!value?.trim()) return;
                              setFormData({ ...formData, productId: value });
                            }}
                            required
                          >
                            <SelectTrigger className="bg-gray-800 text-gray-100 border-gray-700">
                              <SelectValue placeholder="Select product" />
                            </SelectTrigger>
                            <SelectContent className="bg-gray-800 text-gray-100 border-gray-700">
                              {products.map((product: any) => (
                                <SelectItem key={product.id} value={String(product.id)} className="hover:bg-gray-700">
                                  {product.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="rating" className="flex items-center gap-2">
                            <Star className="h-4 w-4" />
                            Rating <span className="text-red-400">*</span>
                          </Label>
                          <Select
                            value={formData.rating.toString()}
                            onValueChange={(value) =>
                              setFormData({ ...formData, rating: parseInt(value) })
                            }
                            required
                          >
                            <SelectTrigger className="bg-gray-800 text-gray-100 border-gray-700">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="bg-gray-800 text-gray-100 border-gray-700">
                              {[5, 4, 3, 2, 1].map((rating) => (
                                <SelectItem key={rating} value={rating.toString()} className="hover:bg-gray-700">
                                  {rating} {rating === 1 ? "Star" : "Stars"}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="userName">Reviewer Name (Optional)</Label>
                          <Input
                            id="userName"
                            value={formData.userName}
                            onChange={(e) =>
                              setFormData({ ...formData, userName: e.target.value })
                            }
                            placeholder="John Doe"
                            className="bg-gray-800 text-gray-100 border-gray-700"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="comment">Comment (Optional)</Label>
                          <Textarea
                            id="comment"
                            value={formData.comment}
                            onChange={(e) =>
                              setFormData({ ...formData, comment: e.target.value })
                            }
                            placeholder="Write a review comment..."
                            rows={4}
                            className="bg-gray-800 text-gray-100 border-gray-700"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="sortOrder">Sort Order</Label>
                          <Input
                            id="sortOrder"
                            type="number"
                            value={formData.sortOrder}
                            onChange={(e) =>
                              setFormData({ ...formData, sortOrder: parseInt(e.target.value) || 0 })
                            }
                            className="bg-gray-800 text-gray-100 border-gray-700"
                          />
                          <p className="text-xs text-gray-400">
                            Lower numbers appear first
                          </p>
                        </div>

                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id="isActive"
                            checked={formData.isActive}
                            onCheckedChange={(checked) =>
                              setFormData({ ...formData, isActive: checked === true })
                            }
                            className="border-gray-700"
                          />
                          <Label htmlFor="isActive" className="text-gray-200">
                            Active
                          </Label>
                        </div>

                        <div className="flex justify-end gap-3">
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => router.push("/admin/ratings")}
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
                                Update Rating
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

