"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import { Loader2, Save, Zap, Calendar, Plus, Trash2, X, Package, Search, Check, ChevronsUpDown } from "lucide-react";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { DateTimePicker } from "@/components/ui/date-time-picker";
import { useFlashSale, useUpdateFlashSale, useFlashSaleItems, useCreateFlashSaleItem, useDeleteFlashSaleItem } from "@/lib/flash-sales";
import { formatDateTime, utcToLocal, localToUTC } from "@/lib/date-utils";
import { useSearchProductItems } from "@/lib/product-items";
import type { ProductItem } from "@/lib/product-items";

// Debounce hook for search optimization
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

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
  const [showAddDialog, setShowAddDialog] = useState(false);
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

  const handleAddSuccess = async () => {
    setShowAddDialog(false);
    await refetch();
  };

  return (
    <>
      <Card className="bg-gray-900 border-gray-800 mt-6">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Flash Sale Items ({items.length})
              </CardTitle>
              <CardDescription>
                Products included in this flash sale
              </CardDescription>
            </div>
            <Button
              onClick={() => setShowAddDialog(true)}
              size="sm"
              className="gap-2"
            >
              <Plus className="h-4 w-4" />
              Add Product
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          ) : items.length === 0 ? (
            <div className="text-center py-8">
              <Package className="h-12 w-12 mx-auto text-gray-600 mb-3" />
              <p className="text-sm text-gray-400 mb-3">
                No items in this flash sale yet.
              </p>
              <Button
                onClick={() => setShowAddDialog(true)}
                variant="outline"
                size="sm"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Your First Product
              </Button>
            </div>
          ) : (
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {items.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between p-3 border border-gray-700 rounded-md hover:border-gray-600 transition-colors"
                >
                  <div className="flex-1">
                    <p className="font-medium text-sm">{item.product_item_name}</p>
                    <p className="text-xs text-gray-400">{item.product_name}</p>
                    <div className="flex gap-4 mt-2 text-xs">
                      <span>Sale: Rp {item.sale_price.toLocaleString('id-ID')}</span>
                      <span className="text-gray-500">Normal: Rp {item.normal_price.toLocaleString('id-ID')}</span>
                      <span className="text-green-400">{item.discount_percentage}% off</span>
                      <span>Stock: {item.stock}</span>
                      <span className="text-gray-500">Sold: {item.sold_count}</span>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-red-500 hover:text-red-600 hover:bg-red-500/10"
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

      <AddFlashSaleItemDialog
        open={showAddDialog}
        onOpenChange={setShowAddDialog}
        flashSaleId={flashSaleId}
        existingItems={items}
        onSuccess={handleAddSuccess}
      />
    </>
  );
}

// Add Flash Sale Item Dialog Component
function AddFlashSaleItemDialog({
  open,
  onOpenChange,
  flashSaleId,
  existingItems,
  onSuccess
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  flashSaleId: string;
  existingItems: any[];
  onSuccess: () => void;
}) {
  const [formData, setFormData] = useState({
    product_item: "",
    sale_price: 0,
    stock: 0,
  });
  const [saving, setSaving] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [comboboxOpen, setComboboxOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<ProductItem | null>(null);

  // Debounce search query for server-side search (300ms delay)
  const debouncedSearchQuery = useDebounce(searchQuery, 300);

  // Server-side search - only fetches when query is 2+ chars
  const { data: searchResults = [], isLoading: isSearching } = useSearchProductItems(debouncedSearchQuery, {
    enabled: open && debouncedSearchQuery.length >= 2,
  });

  // Filter out products already in flash sale
  const filteredProducts = useMemo(() => {
    return searchResults.filter(
      product => !existingItems.some(item => item.product_item === product.id)
    );
  }, [searchResults, existingItems]);

  const createItemMutation = useCreateFlashSaleItem({
    onSuccess: () => {
      toast.success("Product added to flash sale successfully");
      setSaving(false);
      resetForm();
      onSuccess();
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Failed to add product to flash sale");
      setSaving(false);
    },
  });

  const resetForm = () => {
    setFormData({
      product_item: "",
      sale_price: 0,
      stock: 0,
    });
    setSearchQuery("");
    setComboboxOpen(false);
    setSelectedProduct(null);
  };

  const handleClose = () => {
    if (!saving) {
      resetForm();
      onOpenChange(false);
    }
  };

  const handleSelectProduct = (product: ProductItem) => {
    setFormData({
      ...formData,
      product_item: product.id,
      sale_price: Math.round(product.normal_price * 0.8), // Default to 20% off
    });
    setSelectedProduct(product);
    setComboboxOpen(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!formData.product_item) {
      toast.error("Please select a product");
      return;
    }

    if (formData.sale_price <= 0) {
      toast.error("Sale price must be greater than 0");
      return;
    }

    if (formData.stock < 0) {
      toast.error("Stock cannot be negative");
      return;
    }

    // Check if product already exists in flash sale
    const alreadyExists = existingItems.some(
      item => item.product_item === formData.product_item
    );

    if (alreadyExists) {
      toast.error("This product is already in the flash sale");
      return;
    }

    // Validate sale price
    if (selectedProduct && formData.sale_price >= selectedProduct.normal_price) {
      toast.error("Sale price must be lower than normal price");
      return;
    }

    setSaving(true);

    const submitData = {
      flash_sale: flashSaleId,
      product_item: formData.product_item,
      sale_price: formData.sale_price,
      stock: formData.stock,
    };

    createItemMutation.mutate(submitData);
  };

  const discountPercentage = selectedProduct && formData.sale_price > 0
    ? Math.round(((selectedProduct.normal_price - formData.sale_price) / selectedProduct.normal_price) * 100)
    : 0;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[550px] bg-gray-900 border-gray-800 text-white">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-white">
            <Plus className="h-5 w-5" />
            Add Product to Flash Sale
          </DialogTitle>
          <DialogDescription className="text-gray-300">
            Select a product and set the flash sale price and stock
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            {/* Product Selection - Searchable Combobox */}
            <div className="space-y-2">
              <Label htmlFor="product_item" className="flex items-center gap-2 text-white">
                <Package className="h-4 w-4" />
                Product <span className="text-red-400">*</span>
              </Label>
              <Popover open={comboboxOpen} onOpenChange={setComboboxOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={comboboxOpen}
                    className="w-full justify-between bg-gray-800 border-gray-700 text-white hover:bg-gray-700 hover:text-white"
                    disabled={saving}
                  >
                    {formData.product_item ? (
                      <span className="truncate">
                        {selectedProduct?.name || "Select a product"}
                      </span>
                    ) : (
                      <span className="text-gray-400">Search product (min 2 chars)...</span>
                    )}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[500px] p-0 bg-gray-900 border-gray-700" align="start">
                  <Command className="bg-gray-900 text-white" shouldFilter={false}>
                    <CommandInput
                      placeholder="Search by name or SKU (min 2 chars)..."
                      value={searchQuery}
                      onValueChange={setSearchQuery}
                      className="border-gray-700 text-white placeholder:text-gray-400"
                    />
                    <CommandList>
                      {isSearching ? (
                        <div className="py-6 flex items-center justify-center">
                          <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
                          <span className="ml-2 text-sm text-gray-400">Searching...</span>
                        </div>
                      ) : debouncedSearchQuery.length < 2 ? (
                        <CommandEmpty className="py-6 text-center text-sm text-gray-400">
                          Type at least 2 characters to search
                        </CommandEmpty>
                      ) : filteredProducts.length === 0 ? (
                        <CommandEmpty className="py-6 text-center text-sm text-gray-400">
                          No products found
                        </CommandEmpty>
                      ) : (
                        <CommandGroup className="max-h-[300px] overflow-auto">
                          {filteredProducts.map((product) => (
                            <CommandItem
                              key={product.id}
                              value={product.id}
                              onSelect={() => handleSelectProduct(product)}
                              className="cursor-pointer hover:bg-gray-800 text-white aria-selected:bg-gray-800"
                            >
                              <Check
                                className={`mr-2 h-4 w-4 ${formData.product_item === product.id
                                    ? "opacity-100"
                                    : "opacity-0"
                                  }`}
                              />
                              <div className="flex flex-col flex-1 min-w-0">
                                <span className="font-medium truncate">{product.name}</span>
                                <span className="text-xs text-gray-400 truncate">
                                  {product.product_name} • SKU: {product.sku_code} • Rp {product.normal_price.toLocaleString('id-ID')}
                                </span>
                              </div>
                            </CommandItem>
                          ))}
                          {filteredProducts.length >= 50 && (
                            <div className="px-2 py-2 text-xs text-center text-gray-400 border-t border-gray-700">
                              Showing first 50 results. Refine your search for more.
                            </div>
                          )}
                        </CommandGroup>
                      )}
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>

            {/* Product Info Display */}
            {selectedProduct && (
              <div className="p-3 bg-gray-800/50 rounded-md border border-gray-700">
                <p className="text-sm font-medium mb-1 text-white">{selectedProduct.name}</p>
                <p className="text-xs text-gray-400 mb-2">{selectedProduct.product_name}</p>
                <div className="flex gap-4 text-xs text-gray-300">
                  <span>Normal Price: Rp {selectedProduct.normal_price.toLocaleString('id-ID')}</span>
                  <span>Sell Price: Rp {selectedProduct.sell_price.toLocaleString('id-ID')}</span>
                </div>
              </div>
            )}

            {/* Sale Price */}
            <div className="space-y-2">
              <Label htmlFor="sale_price" className="flex items-center gap-2 text-white">
                Flash Sale Price <span className="text-red-400">*</span>
              </Label>
              <Input
                id="sale_price"
                type="number"
                min="0"
                step="1"
                value={formData.sale_price}
                onChange={(e) => setFormData({ ...formData, sale_price: parseInt(e.target.value) || 0 })}
                placeholder="Enter flash sale price"
                disabled={saving || !formData.product_item}
                className="bg-gray-800 border-gray-700 text-white placeholder:text-gray-400"
              />
              {selectedProduct && formData.sale_price > 0 && (
                <div className="flex gap-2 text-xs">
                  <span className={discountPercentage > 0 ? "text-green-400" : "text-red-400"}>
                    {discountPercentage > 0 ? `${discountPercentage}% discount` : 'Price must be lower than normal price'}
                  </span>
                  <span className="text-gray-400">
                    • Savings: Rp {(selectedProduct.normal_price - formData.sale_price).toLocaleString('id-ID')}
                  </span>
                </div>
              )}
            </div>

            {/* Stock */}
            <div className="space-y-2">
              <Label htmlFor="stock" className="flex items-center gap-2 text-white">
                Available Stock <span className="text-red-400">*</span>
              </Label>
              <Input
                id="stock"
                type="number"
                min="0"
                step="1"
                value={formData.stock}
                onChange={(e) => setFormData({ ...formData, stock: parseInt(e.target.value) || 0 })}
                placeholder="Enter available stock"
                disabled={saving}
                className="bg-gray-800 border-gray-700 text-white placeholder:text-gray-400"
              />
              <p className="text-xs text-gray-400">
                Number of items available for this flash sale
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={saving}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={saving || !formData.product_item}
            >
              {saving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Adding...
                </>
              ) : (
                <>
                  <Plus className="mr-2 h-4 w-4" />
                  Add to Flash Sale
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}


