"use client";

import { useState, useEffect } from "react";
import { Loader2, Search, RefreshCw } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { AppSidebar } from "@/components/app-sidebar";
import { AdminHeader } from "@/components/admin-header";
import {
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar";
import { toast } from "sonner";

export interface PriceListItem {
  product_name: string;
  category: string;
  brand: string;
  type: string;
  seller_name: string;
  price: number;
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
  const [priceList, setPriceList] = useState<PriceListItem[]>([]);
  const [filteredList, setFilteredList] = useState<PriceListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [cmd, setCmd] = useState<"prepaid" | "pasca">("prepaid");
  const [syncStatus, setSyncStatus] = useState<any>(null);
  const [isSyncing, setIsSyncing] = useState(false);

  const fetchPriceList = async () => {
    try {
      setLoading(true);
      setError(null);
      // Fetch from database instead of Digiflazz API
      const response = await fetch(`/api/admin/product-items`);
      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Failed to fetch price list");
      }

      // Digiflazz API response structure: { success: true, data: { data: [...] } }
      let items: PriceListItem[] = [];
      
      if (data.data && Array.isArray(data.data.data)) {
        // Standard structure: data.data.data is the array
        items = data.data.data;
      } else if (Array.isArray(data.data)) {
        // Fallback: data.data is directly an array
        items = data.data;
      } else {
        console.warn("Unexpected response structure:", data);
        items = [];
      }
      
      console.log("Parsed items count:", items.length); // Debug log

      setPriceList(items);
      setFilteredList(items);
    } catch (err) {
      console.error("Error fetching price list:", err);
      setError(err instanceof Error ? err.message : "Failed to load price list");
      setPriceList([]);
      setFilteredList([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPriceList();
    fetchSyncStatus();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cmd]);

  const fetchSyncStatus = async () => {
    try {
      const response = await fetch("/api/admin/sync-prices");
      const data = await response.json();
      if (data.lastSync) {
        setSyncStatus(data.lastSync);
      }
    } catch (error) {
      console.error("Error fetching sync status:", error);
    }
  };

  const handleSyncPrices = async () => {
    try {
      setIsSyncing(true);
      const response = await fetch("/api/admin/sync-prices", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          cmd: "full",
        }),
      });

      const data = await response.json();

      if (data.success) {
        toast.success("Price sync completed", {
          description: `Updated ${data.result?.itemsUpdated || 0} items`,
        });
      } else {
        toast.error("Price sync failed", {
          description: data.message || "Please try again",
        });
      }

      // Refresh sync status
      await fetchSyncStatus();
    } catch (error) {
      console.error("Sync error:", error);
      toast.error("Sync failed", {
        description: "An error occurred during sync",
      });
    } finally {
      setIsSyncing(false);
    }
  };


  useEffect(() => {
    if (search.trim() === "") {
      setFilteredList(priceList);
      return;
    }

    const filtered = priceList.filter(
      (item) =>
        item.buyer_sku_code.toLowerCase().includes(search.toLowerCase()) ||
        item.product_name.toLowerCase().includes(search.toLowerCase()) ||
        item.category.toLowerCase().includes(search.toLowerCase()) ||
        item.brand.toLowerCase().includes(search.toLowerCase()) ||
        item.seller_name.toLowerCase().includes(search.toLowerCase())
    );
    setFilteredList(filtered);
  }, [search, priceList]);

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
                      <Button onClick={fetchPriceList} variant="outline">
                        <RefreshCw className="mr-2 h-4 w-4" />
                        Try Again
                      </Button>
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
                        {syncStatus.status === "success" && (
                          <span className="text-green-400">
                            ✓ {syncStatus.itemsUpdated} items updated
                          </span>
                        )}
                        {syncStatus.status === "failed" && (
                          <span className="text-red-400">
                            ✗ Sync failed: {syncStatus.errorMessage || "Unknown error"}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant={cmd === "prepaid" ? "default" : "outline"}
                      onClick={() => setCmd("prepaid")}
                      disabled={loading}
                    >
                      Prepaid
                    </Button>
                    <Button
                      variant={cmd === "pasca" ? "default" : "outline"}
                      onClick={() => setCmd("pasca")}
                      disabled={loading}
                    >
                      Pascabayar
                    </Button>
                    <Button
                      onClick={handleSyncPrices}
                      variant="outline"
                      disabled={isSyncing || loading}
                    >
                      <RefreshCw className={`mr-2 h-4 w-4 ${isSyncing ? "animate-spin" : ""}`} />
                      {isSyncing ? "Syncing..." : "Sync from API"}
                    </Button>
                    <Button onClick={fetchPriceList} variant="outline" disabled={loading}>
                      <RefreshCw className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`} />
                      Refresh
                    </Button>
                  </div>
                </div>

              <div className="mb-4">
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
              </div>

              <div className="rounded-lg border">
                <div className="max-h-[calc(100vh-300px)] overflow-auto">
          <Table>
            <TableHeader className="sticky top-0 bg-gray-900">
              <TableRow>
                <TableHead>SKU Code</TableHead>
                <TableHead>Product Name</TableHead>
                <TableHead>Seller Name</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Type</TableHead>
                <TableHead className="text-right">Price (IDR)</TableHead>
                <TableHead>Status</TableHead>
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
                      {item.desc && (
                        <div className="text-xs text-gray-400">
                          {item.desc}
                        </div>
                      )}
                    </TableCell>
                    <TableCell>{item.seller_name}</TableCell>
                    <TableCell>
                      {typeof item.category === "string"
                        ? item.category
                        : (item.category as any)?.name || "N/A"}
                    </TableCell>
                    <TableCell>{item.type}</TableCell>
                    <TableCell className="text-right font-medium">
                      {formatPrice(item.price)}
                    </TableCell>
                    <TableCell>
                      <span
                        className={`rounded px-2 py-1 text-xs font-semibold ${
                          item.buyer_product_status && item.seller_product_status
                            ? "bg-green-600/20 text-green-400"
                            : "bg-gray-600/20 text-gray-400"
                        }`}
                      >
                        {item.buyer_product_status && item.seller_product_status
                          ? "active"
                          : "inactive"}
                      </span>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={7} className="py-8 text-center text-gray-400">
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

