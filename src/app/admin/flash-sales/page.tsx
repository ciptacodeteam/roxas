"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { Loader2, Search, Plus, Pencil, Trash2, ArrowUpDown, ArrowUp, ArrowDown, X } from "lucide-react";
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
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getPaginationRowModel,
  getFilteredRowModel,
  flexRender,
  type ColumnDef,
  type SortingState,
} from "@tanstack/react-table";
import { AppSidebar } from "@/components/app-sidebar";
import { AdminHeader } from "@/components/admin-header";
import {
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface FlashSaleItem {
  id: string;
  productItemId: string;
  salePrice: number;
  stock: number;
  soldCount: number;
  productItem: {
    id: string;
    name: string;
    sellPrice: number;
    product: {
      name: string;
      category: {
        name: string;
      };
    };
  };
}

interface FlashSale {
  id: string;
  name: string;
  startTime: string;
  endTime: string;
  isActive: boolean;
  createdAt: string;
  items: FlashSaleItem[];
}

interface ProductItem {
  id: string;
  name: string;
  sellPrice: number;
  product: {
    name: string;
    category: {
      name: string;
    };
  };
}

export default function FlashSalesPage() {
  const [flashSales, setFlashSales] = useState<FlashSale[]>([]);
  const [productItems, setProductItems] = useState<ProductItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [sorting, setSorting] = useState<SortingState>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [flashSaleToDelete, setFlashSaleToDelete] = useState<FlashSale | null>(null);
  const [editingFlashSale, setEditingFlashSale] = useState<FlashSale | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    startTime: "",
    endTime: "",
    isActive: true,
  });
  const [items, setItems] = useState<Array<{ productItemId: string; salePrice: number; stock: number }>>([]);

  const fetchFlashSales = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/admin/flash-sales");
      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Failed to fetch flash sales");
      }

      setFlashSales(data.data || []);
    } catch (err) {
      console.error("Error fetching flash sales:", err);
      toast.error("Failed to load flash sales");
      setFlashSales([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchProductItems = async () => {
    try {
      const response = await fetch("/api/admin/product-items/select");
      const data = await response.json();

      if (data.success) {
        setProductItems(data.data || []);
      }
    } catch (err) {
      console.error("Error fetching product items:", err);
    }
  };

  useEffect(() => {
    fetchFlashSales();
    fetchProductItems();
  }, []);

  const handleEdit = useCallback((flashSale: FlashSale) => {
    setEditingFlashSale(flashSale);
    setFormData({
      name: flashSale.name,
      startTime: new Date(flashSale.startTime).toISOString().slice(0, 16),
      endTime: new Date(flashSale.endTime).toISOString().slice(0, 16),
      isActive: flashSale.isActive,
    });
    setItems(flashSale.items.map(item => ({
      productItemId: item.productItemId,
      salePrice: item.salePrice,
      stock: item.stock,
    })));
    setIsDialogOpen(true);
  }, []);

  const handleDeleteClick = useCallback((flashSale: FlashSale) => {
    setFlashSaleToDelete(flashSale);
    setIsDeleteDialogOpen(true);
  }, []);

  const handleDeleteConfirm = useCallback(async () => {
    if (!flashSaleToDelete) return;

    try {
      const response = await fetch(`/api/admin/flash-sales/${flashSaleToDelete.id}`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Failed to delete flash sale");
      }

      toast.success("Flash sale deleted");
      setIsDeleteDialogOpen(false);
      setFlashSaleToDelete(null);
      fetchFlashSales();
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to delete flash sale"
      );
    }
  }, [flashSaleToDelete]);

  const columns = useMemo<ColumnDef<FlashSale>[]>(
    () => [
      {
        accessorKey: "name",
        header: ({ column }) => {
          return (
            <Button
              variant="ghost"
              onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
              className="h-8 px-2"
            >
              Name
              {column.getIsSorted() === "asc" ? (
                <ArrowUp className="ml-2 h-4 w-4" />
              ) : column.getIsSorted() === "desc" ? (
                <ArrowDown className="ml-2 h-4 w-4" />
              ) : (
                <ArrowUpDown className="ml-2 h-4 w-4" />
              )}
            </Button>
          );
        },
        cell: ({ row }) => (
          <div className="font-medium">{row.getValue("name")}</div>
        ),
      },
      {
        accessorKey: "startTime",
        header: "Start Time",
        cell: ({ row }) => {
          const date = new Date(row.getValue("startTime"));
          return date.toLocaleString("id-ID");
        },
      },
      {
        accessorKey: "endTime",
        header: "End Time",
        cell: ({ row }) => {
          const date = new Date(row.getValue("endTime"));
          return date.toLocaleString("id-ID");
        },
      },
      {
        accessorKey: "items",
        header: "Items",
        cell: ({ row }) => {
          const items = row.original.items;
          return <div>{items.length} items</div>;
        },
      },
      {
        accessorKey: "isActive",
        header: "Status",
        cell: ({ row }) => {
          const isActive = row.getValue("isActive") as boolean;
          return (
            <span
              className={`rounded px-2 py-1 text-xs font-semibold ${
                isActive
                  ? "bg-green-600/20 text-green-400"
                  : "bg-gray-600/20 text-gray-400"
              }`}
            >
              {isActive ? "Active" : "Inactive"}
            </span>
          );
        },
      },
      {
        id: "actions",
        header: "Aksi",
        cell: ({ row }) => {
          const flashSale = row.original;
          return (
            <div className="flex justify-end gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => handleEdit(flashSale)}
              >
                <Pencil className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => handleDeleteClick(flashSale)}
              >
                <Trash2 className="h-4 w-4 text-red-400" />
              </Button>
            </div>
          );
        },
      },
    ],
    [handleEdit, handleDeleteClick]
  );

  const table = useReactTable({
    data: flashSales,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onSortingChange: setSorting,
    state: {
      sorting,
      globalFilter: search,
    },
    initialState: {
      pagination: {
        pageSize: 20,
      },
    },
    globalFilterFn: (row, columnId, filterValue) => {
      const flashSale = row.original;
      const searchLower = filterValue.toLowerCase();
      return flashSale.name.toLowerCase().includes(searchLower);
    },
  });

  const handleCreate = () => {
    setEditingFlashSale(null);
    setFormData({
      name: "",
      startTime: "",
      endTime: "",
      isActive: true,
    });
    setItems([]);
    setIsDialogOpen(true);
  };

  const addItem = () => {
    setItems([...items, { productItemId: "", salePrice: 0, stock: 0 }]);
  };

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const updateItem = (index: number, field: string, value: string | number) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };
    setItems(newItems);
  };

  const handleSubmit = async () => {
    try {
      if (!formData.name || !formData.startTime || !formData.endTime) {
        toast.error("Name, start time, and end time are required");
        return;
      }

      if (items.length === 0) {
        toast.error("At least one item is required");
        return;
      }

      const url = editingFlashSale
        ? `/api/admin/flash-sales/${editingFlashSale.id}`
        : "/api/admin/flash-sales";
      const method = editingFlashSale ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          items: items.filter(item => item.productItemId),
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Failed to save flash sale");
      }

      toast.success(
        editingFlashSale ? "Flash sale updated" : "Flash sale created"
      );
      setIsDialogOpen(false);
      fetchFlashSales();
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to save flash sale"
      );
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
                <div className="mb-6 flex items-center justify-between">
                  <div>
                    <h1 className="text-3xl font-bold">Kelola Flash Sales</h1>
                    <p className="mt-2 text-gray-400">
                      Atur dan pantau flash sales Anda di sini.
                    </p>
                  </div>
                  <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                    <DialogTrigger asChild>
                      <Button onClick={handleCreate}>
                        <Plus className="mr-2 h-4 w-4" />
                        Tambah
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="bg-gray-900 text-gray-100 max-w-4xl max-h-[90vh] overflow-y-auto">
                      <DialogHeader>
                        <DialogTitle className="text-gray-100">
                          {editingFlashSale ? "Edit Flash Sale" : "Tambah Flash Sale"}
                        </DialogTitle>
                        <DialogDescription className="text-gray-400">
                          {editingFlashSale
                            ? "Edit data flash sale yang telah tersedia."
                            : "Tambahkan flash sale baru."}
                        </DialogDescription>
                      </DialogHeader>
                      <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                          <Label htmlFor="name" className="text-gray-200">
                            Name <span className="text-red-400">*</span>
                          </Label>
                          <Input
                            id="name"
                            value={formData.name}
                            onChange={(e) =>
                              setFormData({ ...formData, name: e.target.value })
                            }
                            placeholder="Flash Sale Name"
                            className="bg-gray-800 text-gray-100 border-gray-700"
                            required
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="grid gap-2">
                            <Label htmlFor="startTime" className="text-gray-200">
                              Start Time <span className="text-red-400">*</span>
                            </Label>
                            <Input
                              id="startTime"
                              type="datetime-local"
                              value={formData.startTime}
                              onChange={(e) =>
                                setFormData({ ...formData, startTime: e.target.value })
                              }
                              className="bg-gray-800 text-gray-100 border-gray-700"
                              required
                            />
                          </div>
                          <div className="grid gap-2">
                            <Label htmlFor="endTime" className="text-gray-200">
                              End Time <span className="text-red-400">*</span>
                            </Label>
                            <Input
                              id="endTime"
                              type="datetime-local"
                              value={formData.endTime}
                              onChange={(e) =>
                                setFormData({ ...formData, endTime: e.target.value })
                              }
                              className="bg-gray-800 text-gray-100 border-gray-700"
                              required
                            />
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Checkbox
                            id="isActive"
                            checked={formData.isActive}
                            onCheckedChange={(checked) =>
                              setFormData({ ...formData, isActive: !!checked })
                            }
                          />
                          <Label htmlFor="isActive" className="text-gray-200">Active</Label>
                        </div>
                        <div className="grid gap-2">
                          <div className="flex items-center justify-between">
                            <Label className="text-gray-200">Items</Label>
                            <Button type="button" onClick={addItem} size="sm">
                              <Plus className="mr-2 h-4 w-4" />
                              Add Item
                            </Button>
                          </div>
                          <div className="space-y-2 max-h-64 overflow-y-auto">
                            {items.map((item, index) => {
                              const selectedProduct = productItems.find(p => p.id === item.productItemId);
                              return (
                                <div key={index} className="flex gap-2 items-end p-2 border border-gray-700 rounded">
                                  <div className="flex-1">
                                    <Label className="text-gray-200 text-xs">Product Item</Label>
                                    <Select
                                      value={item.productItemId}
                                      onValueChange={(value) => {
                                        const product = productItems.find(p => p.id === value);
                                        updateItem(index, "productItemId", value);
                                        if (product) {
                                          updateItem(index, "salePrice", product.sellPrice);
                                        }
                                      }}
                                    >
                                      <SelectTrigger className="bg-gray-800 text-gray-100 border-gray-700">
                                        <SelectValue placeholder="Select product" />
                                      </SelectTrigger>
                                      <SelectContent className="bg-gray-800 text-gray-100">
                                        {productItems.map((product) => (
                                          <SelectItem key={product.id} value={product.id} className="hover:bg-gray-700">
                                            {product.product.name} - {product.name} ({product.product.category.name})
                                          </SelectItem>
                                        ))}
                                      </SelectContent>
                                    </Select>
                                  </div>
                                  <div className="w-32">
                                    <Label className="text-gray-200 text-xs">Sale Price</Label>
                                    <Input
                                      type="number"
                                      value={item.salePrice}
                                      onChange={(e) =>
                                        updateItem(index, "salePrice", parseInt(e.target.value) || 0)
                                      }
                                      className="bg-gray-800 text-gray-100 border-gray-700"
                                    />
                                  </div>
                                  <div className="w-32">
                                    <Label className="text-gray-200 text-xs">Stock</Label>
                                    <Input
                                      type="number"
                                      value={item.stock}
                                      onChange={(e) =>
                                        updateItem(index, "stock", parseInt(e.target.value) || 0)
                                      }
                                      className="bg-gray-800 text-gray-100 border-gray-700"
                                    />
                                  </div>
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => removeItem(index)}
                                  >
                                    <X className="h-4 w-4" />
                                  </Button>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                      <DialogFooter>
                        <Button
                          variant="outline"
                          onClick={() => setIsDialogOpen(false)}
                        >
                          Batal
                        </Button>
                        <Button onClick={handleSubmit}>Simpan</Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>

                  <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                    <DialogContent className="bg-gray-900 text-gray-100">
                      <DialogHeader>
                        <DialogTitle className="text-gray-100">
                          Hapus Flash Sale
                        </DialogTitle>
                        <DialogDescription className="text-gray-400">
                          Apakah Anda yakin ingin menghapus flash sale{" "}
                          <span className="font-semibold text-gray-200">
                            {flashSaleToDelete?.name}
                          </span>
                          ? Tindakan ini tidak dapat dibatalkan.
                        </DialogDescription>
                      </DialogHeader>
                      <DialogFooter>
                        <Button
                          variant="outline"
                          onClick={() => {
                            setIsDeleteDialogOpen(false);
                            setFlashSaleToDelete(null);
                          }}
                          className="bg-gray-800 text-gray-200 border-gray-700 hover:bg-gray-700"
                        >
                          Batal
                        </Button>
                        <Button
                          onClick={handleDeleteConfirm}
                          className="bg-red-600 text-white hover:bg-red-700"
                        >
                          Hapus
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>

                <div className="mb-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                    <Input
                      type="text"
                      placeholder="Search..."
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>

                {loading ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-rose-500" />
                  </div>
                ) : (
                  <>
                    <div className="rounded-lg border">
                      <Table>
                        <TableHeader>
                          {table.getHeaderGroups().map((headerGroup) => (
                            <TableRow key={headerGroup.id}>
                              {headerGroup.headers.map((header) => (
                                <TableHead key={header.id}>
                                  {header.isPlaceholder
                                    ? null
                                    : flexRender(
                                        header.column.columnDef.header,
                                        header.getContext()
                                      )}
                                </TableHead>
                              ))}
                            </TableRow>
                          ))}
                        </TableHeader>
                        <TableBody>
                          {table.getRowModel().rows?.length ? (
                            table.getRowModel().rows.map((row) => (
                              <TableRow
                                key={row.id}
                                data-state={row.getIsSelected() && "selected"}
                              >
                                {row.getVisibleCells().map((cell) => (
                                  <TableCell key={cell.id}>
                                    {flexRender(
                                      cell.column.columnDef.cell,
                                      cell.getContext()
                                    )}
                                  </TableCell>
                                ))}
                              </TableRow>
                            ))
                          ) : (
                            <TableRow>
                              <TableCell
                                colSpan={columns.length}
                                className="py-8 text-center text-gray-400"
                              >
                                No flash sales found
                              </TableCell>
                            </TableRow>
                          )}
                        </TableBody>
                      </Table>
                    </div>
                    <div className="flex items-center justify-between px-2 py-4">
                      <div className="text-sm text-gray-400">
                        Showing {table.getState().pagination.pageIndex * table.getState().pagination.pageSize + 1} to{" "}
                        {Math.min(
                          (table.getState().pagination.pageIndex + 1) *
                            table.getState().pagination.pageSize,
                          table.getFilteredRowModel().rows.length
                        )}{" "}
                        of {table.getFilteredRowModel().rows.length} flash sales
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => table.previousPage()}
                          disabled={!table.getCanPreviousPage()}
                        >
                          Previous
                        </Button>
                        <div className="text-sm text-gray-400">
                          Page {table.getState().pagination.pageIndex + 1} of{" "}
                          {table.getPageCount()}
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => table.nextPage()}
                          disabled={!table.getCanNextPage()}
                        >
                          Next
                        </Button>
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

