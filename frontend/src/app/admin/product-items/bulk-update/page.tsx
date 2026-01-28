"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Save, ArrowLeft, Calculator } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useAdminProducts, useAdminProductItems } from "@/lib/queries";

interface ProductItemPreview {
  id: string;
  name: string;
  basePrice: number;
  normalPrice: number;
  discountedPrice: number | null;
  sellPrice: number;
  newSellPrice?: number;
}

interface Product {
  id: string;
  name: string;
}

interface ProductItem {
  id: string;
  name: string;
  basePrice: number;
  normalPrice: number;
  discountedPrice: number | null;
  sellPrice: number;
  product: {
    id: string;
    name: string;
  };
}

export default function BulkUpdatePage() {
  const router = useRouter();
  const [selectedProductId, setSelectedProductId] = useState("");
  const [marginPercentage, setMarginPercentage] = useState("5");
  const [priceBase, setPriceBase] = useState<"basePrice" | "normalPrice" | "discountedPrice">("basePrice");
  const [updating, setUpdating] = useState(false);
  const [preview, setPreview] = useState<ProductItemPreview[]>([]);
  const [showPreview, setShowPreview] = useState(false);

  const { data: productsData = [] } = useAdminProducts();
  const { data: productItemsData = [] } = useAdminProductItems();

  const products: Product[] = useMemo(() => {
    if (!Array.isArray(productsData)) return [];
    return productsData.map((p: any) => ({
      id: p.id,
      name: p.name,
    }));
  }, [productsData]);

  const productItems: ProductItem[] = useMemo(() => {
    if (!Array.isArray(productItemsData)) return [];
    return productItemsData as ProductItem[];
  }, [productItemsData]);

  const itemsForSelectedProduct = useMemo(() => {
    if (!selectedProductId) return [];
    return productItems.filter((item) => item.product.id === selectedProductId);
  }, [selectedProductId, productItems]);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(price);
  };

  const handleGeneratePreview = () => {
    if (!selectedProductId || !marginPercentage) {
      toast.error("Please select a product and enter a margin percentage");
      return;
    }

    const margin = parseFloat(marginPercentage) / 100;

    const previewItems: ProductItemPreview[] = itemsForSelectedProduct.map((item) => {
      let baseForCalculation = item.basePrice;

      if (priceBase === "normalPrice") {
        baseForCalculation = item.normalPrice;
      } else if (priceBase === "discountedPrice" && item.discountedPrice) {
        baseForCalculation = item.discountedPrice;
      }

      const newSellPrice = Math.ceil(baseForCalculation * (1 + margin));

      return {
        id: item.id,
        name: item.name,
        basePrice: item.basePrice,
        normalPrice: item.normalPrice,
        discountedPrice: item.discountedPrice,
        sellPrice: item.sellPrice,
        newSellPrice,
      };
    });

    setPreview(previewItems);
    setShowPreview(true);
  };

  const handleApply = async () => {
    if (preview.length === 0) {
      toast.error("No items to update");
      return;
    }

    setUpdating(true);

    try {
      // Update all items in parallel
      const updatePromises = preview.map((item) =>
        fetch(`/api/admin/product-items/${item.id}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            sellPrice: item.newSellPrice,
          }),
        }).then((res) => {
          if (!res.ok) throw new Error(`Failed to update item ${item.id}`);
          return res.json();
        })
      );

      await Promise.all(updatePromises);
      toast.success(`Successfully updated ${preview.length} product items`);
      
      // Redirect back to product items list
      setTimeout(() => {
        router.push("/admin/product-items");
      }, 500);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to update product items"
      );
    } finally {
      setUpdating(false);
    }
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
                <div className="mb-6 flex items-center gap-4">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => router.push("/admin/product-items")}
                  >
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back to Product Items
                  </Button>
                </div>

                <div className="mb-6">
                  <div className="flex items-center gap-2">
                    <Calculator className="h-6 w-6" />
                    <div>
                      <h1 className="text-3xl font-bold">Bulk Price Update</h1>
                      <p className="mt-2 text-gray-400">
                        Update sell prices for all items in a product with a fixed margin
                      </p>
                    </div>
                  </div>
                </div>

                {/* Configuration */}
                <div className="max-w-2xl">
                  <Card className="border-gray-800 bg-gray-900">
                    <CardHeader>
                      <CardTitle>Update Configuration</CardTitle>
                      <CardDescription>
                        Set the margin percentage to apply to all items
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-6">
                        {/* Product Selection */}
                        <div className="space-y-2">
                          <Label htmlFor="product">Select Product</Label>
                          <Select value={selectedProductId} onValueChange={setSelectedProductId}>
                            <SelectTrigger id="product" className="border-gray-700 bg-gray-800">
                              <SelectValue placeholder="Choose a product..." />
                            </SelectTrigger>
                            <SelectContent className="border-gray-700 bg-gray-900">
                              {products.map((product) => (
                                <SelectItem key={product.id} value={product.id}>
                                  {product.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        {/* Price Base Selection */}
                        <div className="space-y-2">
                          <Label htmlFor="price-base">Calculate Margin From</Label>
                          <Select
                            value={priceBase}
                            onValueChange={(value) =>
                              setPriceBase(value as "basePrice" | "normalPrice" | "discountedPrice")
                            }
                          >
                            <SelectTrigger id="price-base" className="border-gray-700 bg-gray-800">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="border-gray-700 bg-gray-900">
                              <SelectItem value="basePrice">Base Price</SelectItem>
                              <SelectItem value="normalPrice">Normal Price</SelectItem>
                              <SelectItem value="discountedPrice">Discounted Price</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        {/* Margin Percentage */}
                        <div className="space-y-2">
                          <Label htmlFor="margin">Margin Percentage (%)</Label>
                          <Input
                            id="margin"
                            type="number"
                            min="0"
                            step="0.1"
                            value={marginPercentage}
                            onChange={(e) => setMarginPercentage(e.target.value)}
                            placeholder="5"
                            className="border-gray-700 bg-gray-800 text-gray-100"
                          />
                          <p className="text-xs text-gray-400">
                            Example: 5% margin will multiply the price by 1.05
                          </p>
                        </div>

                        {/* Item Count */}
                        {selectedProductId && (
                          <div className="rounded-md border border-gray-700 bg-gray-800 p-3">
                            <p className="text-sm text-gray-300">
                              Found <Badge variant="secondary">{itemsForSelectedProduct.length}</Badge> items for
                              this product
                            </p>
                          </div>
                        )}

                        <Button
                          onClick={handleGeneratePreview}
                          disabled={!selectedProductId || !marginPercentage}
                          className="w-full bg-blue-600 hover:bg-blue-700"
                        >
                          Generate Preview
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Preview Table */}
                {showPreview && preview.length > 0 && (
                  <div className="mt-8">
                    <Card className="border-gray-800 bg-gray-900">
                      <CardHeader>
                        <CardTitle>Preview Changes</CardTitle>
                        <CardDescription>
                          Review the pricing changes before applying
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="overflow-x-auto">
                          <Table>
                            <TableHeader>
                              <TableRow className="border-gray-700">
                                <TableHead>Item Name</TableHead>
                                <TableHead className="text-right">Current Price</TableHead>
                                <TableHead className="text-right">New Price</TableHead>
                                <TableHead className="text-right">Difference</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {preview.map((item) => (
                                <TableRow key={item.id} className="border-gray-700">
                                  <TableCell className="font-medium">{item.name}</TableCell>
                                  <TableCell className="text-right">
                                    {formatPrice(item.sellPrice)}
                                  </TableCell>
                                  <TableCell className="text-right text-green-400">
                                    {formatPrice(item.newSellPrice!)}
                                  </TableCell>
                                  <TableCell className="text-right text-gray-400">
                                    {formatPrice((item.newSellPrice! - item.sellPrice))}
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </div>

                        <Separator className="my-6 border-gray-700" />

                        <div className="flex gap-3">
                          <Button
                            onClick={() => setShowPreview(false)}
                            variant="outline"
                            className="flex-1 border-gray-700"
                          >
                            Cancel
                          </Button>
                          <Button
                            onClick={handleApply}
                            disabled={updating}
                            className="flex-1 gap-2 bg-green-600 hover:bg-green-700"
                          >
                            {updating && <Loader2 className="h-4 w-4 animate-spin" />}
                            Apply Changes ({preview.length} items)
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
