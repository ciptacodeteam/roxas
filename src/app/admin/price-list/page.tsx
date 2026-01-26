"use client";

import { useState, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Search, RefreshCw, Upload, Pencil } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { useSyncStatus, useSyncPrices, queryKeys } from "@/lib/queries";
import { useQueryClient, useQuery } from "@tanstack/react-query";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { AppSidebar } from "@/components/app-sidebar";
import { AdminHeader } from "@/components/admin-header";
import {
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar";
import { toast } from "sonner";

export interface PriceListItem {
  id?: string; // Product item ID for editing
  product_name: string;
  product: string; // Product/Brand name
  category: string;
  brand: string;
  type: string;
  seller_name: string;
  price: number;
  basePrice: number; // Base price from Digiflazz
  normalPrice: number;
  sellPrice: number;
  discountedPrice: number;
  buyer_sku_code: string;
  buyer_product_status: boolean;
  seller_product_status: boolean;
  unlimited_stock: boolean;
  stock: number;
  multi: boolean;
  start_cut_off: string;
  end_cut_off: string;
  desc: string;
}

export default function PriceListPage() {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [selectedProduct, setSelectedProduct] = useState<string>("");
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [isJsonInputDialogOpen, setIsJsonInputDialogOpen] = useState(false);
  const [jsonInput, setJsonInput] = useState("");
  const [autoCreate, setAutoCreate] = useState(true);
  const queryClient = useQueryClient();

  const handleEdit = useCallback((item: PriceListItem) => {
    if (item.id) {
      router.push(`/admin/product-items/${item.id}`);
    } else {
      // Fallback: try to find by SKU code
      toast.error("Product item ID not found. Please use the Product Items page to edit.");
    }
  }, [router]);

  const { data: productItemsData, isLoading: loading, error: queryError, refetch } = useQuery({
    queryKey: [...queryKeys.productItems.list(), "priceList"],
    queryFn: async () => {
      const response = await fetch("/api/admin/product-items?format=priceList");
      if (!response.ok) {
        throw new Error("Failed to fetch product items");
      }
      const data = await response.json();
      if (!data.success) {
        throw new Error(data.message || "Failed to fetch product items");
      }
      return data.data || [];
    },
    refetchOnMount: "always",
    refetchOnWindowFocus: true,
    staleTime: 0,
  });
  const { data: syncStatus } = useSyncStatus();
  const syncPricesMutation = useSyncPrices({
    onSuccess: async (data) => {
      toast.success("Price sync completed", {
        description: `Updated ${data.result?.itemsUpdated || 0} items`,
      });
      queryClient.invalidateQueries({ queryKey: queryKeys.productItems.all });
      await refetch();
    },
    onError: (error) => {
      toast.error("Price sync failed", {
        description: error instanceof Error ? error.message : "Please try again",
      });
    },
  });

  // Parse product items data
  const priceList: PriceListItem[] = useMemo(() => {
    if (!productItemsData) return [];

    if (Array.isArray(productItemsData)) {
      return productItemsData;
    }

    // Handle nested data structure
    if (productItemsData && typeof productItemsData === "object" && "data" in productItemsData) {
      const nestedData = (productItemsData as { data: unknown }).data;
      if (Array.isArray(nestedData)) {
        return nestedData;
      }
    }

    console.warn("Unexpected response structure:", productItemsData);
    return [];
  }, [productItemsData]);

  const error = queryError
    ? (queryError instanceof Error ? queryError.message : "Failed to load price list")
    : null;

  // Extract unique products and categories for filtering
  const uniqueProducts = useMemo(() => {
    const products = new Set<string>();
    priceList.forEach((item) => {
      if (item.brand) products.add(item.brand);
    });
    return Array.from(products).sort();
  }, [priceList]);

  const uniqueCategories = useMemo(() => {
    const categories = new Set<string>();
    priceList.forEach((item) => {
      if (typeof item.category === "string") {
        categories.add(item.category);
      } else if ((item.category as any)?.name) {
        categories.add((item.category as any).name);
      }
    });
    return Array.from(categories).sort();
  }, [priceList]);

  const filteredList = useMemo(() => {
    let filtered = priceList;

    // Filter by product (brand)
    if (selectedProduct) {
      filtered = filtered.filter((item) => item.brand === selectedProduct);
    }

    // Filter by category
    if (selectedCategory) {
      filtered = filtered.filter((item) => {
        const cat = typeof item.category === "string"
          ? item.category
          : (item.category as any)?.name;
        return cat === selectedCategory;
      });
    }

    // Filter by search
    if (search.trim() !== "") {
      filtered = filtered.filter(
        (item) =>
          item.buyer_sku_code.toLowerCase().includes(search.toLowerCase()) ||
          item.product_name.toLowerCase().includes(search.toLowerCase()) ||
          item.category.toString().toLowerCase().includes(search.toLowerCase()) ||
          item.brand.toLowerCase().includes(search.toLowerCase()) ||
          item.seller_name.toLowerCase().includes(search.toLowerCase())
      );
    }

    return filtered;
  }, [search, priceList, selectedProduct, selectedCategory]);

  const handleSyncPrices = () => {
    syncPricesMutation.mutate({ cmd: "full", autoCreate });
  };

  const handleSyncFromJson = () => {
    try {
      const parsed = JSON.parse(jsonInput);

      // Handle different JSON structures
      let prepaid: PriceListItem[] | undefined;
      let pasca: PriceListItem[] | undefined;

      // Check if it's the Digiflazz API response format
      if (parsed.data?.data && Array.isArray(parsed.data.data)) {
        // Single array
        prepaid = parsed.data.data;
      } else if (Array.isArray(parsed)) {
        // Direct array
        prepaid = parsed;
      } else if (parsed.prepaid || parsed.pasca) {
        // Object with prepaid/pasca keys
        prepaid = Array.isArray(parsed.prepaid) ? parsed.prepaid : undefined;
        pasca = Array.isArray(parsed.pasca) ? parsed.pasca : undefined;
      } else {
        throw new Error("Invalid JSON format. Expected array or object with 'data.data' array, or object with 'prepaid'/'pasca' arrays");
      }

      syncPricesMutation.mutate({
        cmd: "full",
        jsonData: { prepaid, pasca },
        autoCreate
      });
      setIsJsonInputDialogOpen(false);
      setJsonInput("");
    } catch (error) {
      toast.error("Invalid JSON", {
        description: error instanceof Error ? error.message : "Please check your JSON format",
      });
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(price);
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
                {loading && (
                  <div className="flex items-center justify-center py-12">
                    <div className="flex flex-col items-center gap-4">
                      <Loader2 className="h-8 w-8 animate-spin text-rose-500" />
                      <span className="text-lg">Loading price list...</span>
                    </div>
                  </div>
                )}

                {error && !loading && (
                  <div className="flex items-center justify-center py-12">
                    <div className="flex flex-col items-center gap-4">
                      <p className="text-red-400 text-lg">❌ {error}</p>
                    </div>
                  </div>
                )}

                {!loading && !error && (
                  <>
                    <div className="mb-6 flex items-center justify-between">
                      <div>
                        <h1 className="text-3xl font-bold">Digiflazz Price List</h1>
                        <p className="mt-2 text-gray-400">
                          Total products: {priceList.length} | Showing: {filteredList.length}
                        </p>
                        {syncStatus && (
                          <div className="mt-2 flex items-center gap-4 text-sm">
                            <span className="text-gray-400">
                              Last synced:{" "}
                              {syncStatus.completedAt
                                ? `${syncStatus.ageMinutes} minutes ago`
                                : "Never"}
                            </span>
                            {(syncStatus.status === "SUCCESS" || syncStatus.status === "success") && (
                              <>
                                <span className="text-green-400">
                                  ✓ {syncStatus.itemsUpdated || 0} items updated
                                </span>
                                {syncStatus.itemsCreated > 0 && (
                                  <span className="text-blue-400">
                                    + {syncStatus.itemsCreated} items created
                                  </span>
                                )}
                              </>
                            )}
                            {(syncStatus.status === "FAILED" || syncStatus.status === "failed") && (
                              <span className="text-red-400">
                                ✗ Sync failed: {syncStatus.errorMessage || "Unknown error"}
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                      <div className="flex flex-col gap-2">
                        <div className="flex gap-2">
                          <Button
                            onClick={handleSyncPrices}
                            variant="outline"
                            disabled={syncPricesMutation.isPending || loading}
                          >
                            <RefreshCw className={`mr-2 h-4 w-4 ${syncPricesMutation.isPending ? "animate-spin" : ""}`} />
                            {syncPricesMutation.isPending ? "Syncing..." : "Sync from API"}
                          </Button>
                          <Button
                            onClick={() => setIsJsonInputDialogOpen(true)}
                            variant="outline"
                            disabled={syncPricesMutation.isPending || loading}
                          >
                            <Upload className="mr-2 h-4 w-4" />
                            Sync from JSON
                          </Button>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id="auto-create-sync"
                            checked={autoCreate}
                            onCheckedChange={(checked) => setAutoCreate(checked === true)}
                          />
                          <Label htmlFor="auto-create-sync" className="text-sm cursor-pointer">
                            Auto-create new products
                          </Label>
                        </div>
                      </div>
                    </div>
                    <Dialog open={isJsonInputDialogOpen} onOpenChange={setIsJsonInputDialogOpen}>
                      <DialogContent className="max-w-4xl max-h-[80vh] flex flex-col">
                        <DialogHeader>
                          <DialogTitle>Sync Prices from JSON</DialogTitle>
                          <DialogDescription>
                            Paste JSON data from Digiflazz API. Supports array format or object with 'data.data' array, or object with 'prepaid'/'pasca' arrays.
                          </DialogDescription>
                        </DialogHeader>
                        <div className="flex-1 overflow-y-auto space-y-4 pr-2">
                          <div className="space-y-2">
                            <Label htmlFor="json-input">JSON Data</Label>
                            <Textarea
                              id="json-input"
                              value={jsonInput}
                              onChange={(e) => setJsonInput(e.target.value)}
                              placeholder='Paste JSON here... Example: {"data": {"data": [...]}} or [{"buyer_sku_code": "...", ...}]'
                              className="bg-gray-900 text-gray-100 border-gray-700 font-mono text-sm min-h-[300px]"
                            />
                          </div>
                          <div className="flex items-center space-x-2">
                            <Checkbox
                              id="auto-create"
                              checked={autoCreate}
                              onCheckedChange={(checked) => setAutoCreate(checked === true)}
                            />
                            <Label htmlFor="auto-create" className="cursor-pointer">
                              Auto-create new products (creates Category → Product → ProductItem for new items)
                            </Label>
                          </div>
                        </div>
                        <div className="flex justify-end gap-2 mt-4 shrink-0">
                          <Button
                            variant="outline"
                            onClick={() => {
                              setIsJsonInputDialogOpen(false);
                              setJsonInput("");
                            }}
                          >
                            Cancel
                          </Button>
                          <Button
                            onClick={handleSyncFromJson}
                            disabled={!jsonInput.trim() || syncPricesMutation.isPending}
                          >
                            {syncPricesMutation.isPending ? (
                              <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Syncing...
                              </>
                            ) : (
                              <>
                                <Upload className="mr-2 h-4 w-4" />
                                Sync from JSON
                              </>
                            )}
                          </Button>
                        </div>
                      </DialogContent>
                    </Dialog>

                    <div className="mb-4 space-y-4">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                        <Input
                          type="text"
                          placeholder="Search by SKU, product name, or category..."
                          value={search}
                          onChange={(e) => setSearch(e.target.value)}
                          className="pl-10"
                        />
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="filter-product">Filter by Product</Label>
                          <select
                            id="filter-product"
                            value={selectedProduct}
                            onChange={(e) => setSelectedProduct(e.target.value)}
                            className="w-full px-3 py-2 rounded-md border border-gray-700 bg-gray-950 text-gray-100"
                          >
                            <option value="">All Products</option>
                            {uniqueProducts.map((product) => (
                              <option key={product} value={product}>
                                {product}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="filter-category">Filter by Category</Label>
                          <select
                            id="filter-category"
                            value={selectedCategory}
                            onChange={(e) => setSelectedCategory(e.target.value)}
                            className="w-full px-3 py-2 rounded-md border border-gray-700 bg-gray-950 text-gray-100"
                          >
                            <option value="">All Categories</option>
                            {uniqueCategories.map((category) => (
                              <option key={category} value={category}>
                                {category}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                    </div>

                    <div className="rounded-lg border">
                      <div className="max-h-[calc(100vh-300px)] overflow-auto">
                        <Table>
                          <TableHeader className="sticky top-0 bg-gray-900">
                            <TableRow>
                              <TableHead>SKU Code</TableHead>
                              <TableHead>Product Name</TableHead>
                              <TableHead>Product</TableHead>
                              <TableHead>Category</TableHead>
                              <TableHead className="text-right">Base Price (IDR)</TableHead>
                              <TableHead className="text-right">Sell Price (IDR)</TableHead>
                              <TableHead className="text-right">Discount Price (IDR)</TableHead>
                              <TableHead>Status</TableHead>
                              <TableHead className="text-right">Action</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {filteredList.length > 0 ? (
                              filteredList.map((item, index) => (
                                <TableRow key={`${item.buyer_sku_code}-${index}`}>
                                  <TableCell className="font-mono text-sm">
                                    {item.buyer_sku_code}
                                  </TableCell>
                                  <TableCell className="max-w-xs">
                                    <div className="font-medium">{item.product_name}</div>
                                  </TableCell>
                                  <TableCell>{item.product}</TableCell>
                                  <TableCell>
                                    {typeof item.category === "string"
                                      ? item.category
                                      : (item.category as any)?.name || "N/A"}
                                  </TableCell>
                                  <TableCell className="text-right font-medium">
                                    {formatPrice(item.basePrice)}
                                  </TableCell>
                                  <TableCell className="text-right font-medium">
                                    {formatPrice(item.sellPrice)}
                                  </TableCell>
                                  <TableCell className="text-right font-medium">
                                    {item.discountedPrice > 0 ? formatPrice(item.discountedPrice) : "-"}
                                  </TableCell>
                                  <TableCell>
                                    <span
                                      className={`rounded px-2 py-1 text-xs font-semibold ${item.buyer_product_status && item.seller_product_status
                                        ? "bg-green-600/20 text-green-400"
                                        : "bg-gray-600/20 text-gray-400"
                                        }`}
                                    >
                                      {item.buyer_product_status && item.seller_product_status
                                        ? "active"
                                        : "inactive"}
                                    </span>
                                  </TableCell>
                                  <TableCell className="text-right">
                                    {item.id ? (
                                      <Tooltip>
                                        <TooltipTrigger asChild>
                                          <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => handleEdit(item)}
                                            className="hover:bg-rose-500/10 hover:text-rose-400"
                                          >
                                            <Pencil className="h-4 w-4" />
                                          </Button>
                                        </TooltipTrigger>
                                        <TooltipContent>
                                          <p>Edit Product Item</p>
                                        </TooltipContent>
                                      </Tooltip>
                                    ) : (
                                      <span className="text-xs text-gray-500">-</span>
                                    )}
                                  </TableCell>
                                </TableRow>
                              ))
                            ) : (
                              <TableRow>
                                <TableCell colSpan={9} className="py-8 text-center text-gray-400">
                                  {priceList.length === 0
                                    ? "No products found"
                                    : "No products match your search"}
                                </TableCell>
                              </TableRow>
                            )}
                          </TableBody>
                        </Table>
                      </div>
                    </div>

                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}

