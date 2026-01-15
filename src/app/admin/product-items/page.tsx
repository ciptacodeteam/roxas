"use client";

import { useState, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Search, Pencil, ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import Image from "next/image";
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
import { useAdminProductItems } from "@/lib/queries";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatDateTime } from "@/lib/date-utils";
import { Badge } from "@/components/ui/badge";
import { TableSkeleton } from "@/components/admin/table-skeleton";
import { EmptyState } from "@/components/admin/empty-state";
import { PackageSearch } from "lucide-react";

interface ProductItem {
  id: string;
  name: string;
  skuCode: string;
  iconImage: string | null;
  basePrice: number;
  normalPrice: number;
  discountedPrice: number | null;
  sellPrice: number;
  isActive: boolean;
  digiflazzStatus: string | null;
  createdAt: string;
  product: {
    id: string;
    name: string;
    category: {
      id: string;
      name: string;
    };
  };
}

export default function ProductItemsPage() {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [sorting, setSorting] = useState<SortingState>([]);

  // Use TanStack Query hook - fetch all items, filter client-side
  const { data: productItemsData, isLoading: loading } = useAdminProductItems();

  // Ensure we extract the data array correctly
  const productItems: ProductItem[] = useMemo(() => {
    if (!productItemsData) return [];
    // Handle both direct array and wrapped response
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
    console.warn("Unexpected product items data structure:", productItemsData);
    return [];
  }, [productItemsData]);

  const handleEdit = useCallback((item: ProductItem) => {
    router.push(`/admin/product-items/${item.id}`);
  }, [router]);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(price);
  };

  const columns = useMemo<ColumnDef<ProductItem>[]>(
    () => [
      {
        accessorKey: "iconImage",
        header: "Preview",
        cell: ({ row }) => {
          const image = row.original.iconImage;
          return image ? (
            <div className="h-12 w-12 overflow-hidden rounded-md">
              <Image
                src={image}
                alt={row.original.name}
                width={48}
                height={48}
                className="h-full w-full object-cover"
              />
            </div>
          ) : (
            <div className="flex h-12 w-12 items-center justify-center rounded-md bg-gray-800 text-gray-500 text-xs">
              No Image
            </div>
          );
        },
        enableSorting: false,
      },
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
          <div>
            <div className="font-medium">{row.getValue("name")}</div>
            <div className="text-sm text-gray-400">{row.original.skuCode}</div>
          </div>
        ),
      },
      {
        accessorKey: "product.name",
        header: "Product",
        cell: ({ row }) => {
          const product = row.original.product;
          if (!product) {
            return <div className="text-gray-500 text-sm">N/A</div>;
          }
          return (
            <div>
              <div className="font-medium">{product.name || "N/A"}</div>
              <div className="text-sm text-gray-400">{product.category?.name || "N/A"}</div>
            </div>
          );
        },
      },
      {
        accessorKey: "sellPrice",
        header: ({ column }) => {
          return (
            <Button
              variant="ghost"
              onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
              className="h-8 px-2"
            >
              Price
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
        cell: ({ row }) => {
          const item = row.original;
          return (
            <div>
              <div className="font-medium">{formatPrice(item.sellPrice)}</div>
              <div className="text-sm text-gray-400">
                Base: {formatPrice(item.basePrice)}
              </div>
            </div>
          );
        },
      },
      {
        accessorKey: "isActive",
        header: ({ column }) => {
          return (
            <Button
              variant="ghost"
              onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
              className="h-8 px-2"
            >
              Status
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
        cell: ({ row }) => {
          const isActive = row.getValue("isActive") as boolean;
          return (
            <Badge
              variant={isActive ? "default" : "secondary"}
              className={isActive ? "bg-green-600/20 text-green-400" : "bg-gray-600/20 text-gray-400"}
            >
              {isActive ? "Active" : "Inactive"}
            </Badge>
          );
        },
      },
      {
        accessorKey: "createdAt",
        header: ({ column }) => {
          return (
            <Button
              variant="ghost"
              onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
              className="h-8 px-2"
            >
              Created At
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
        cell: ({ row }) => {
          const date = row.getValue("createdAt") as string;
          return date ? formatDateTime(date) : "-";
        },
      },
      {
        id: "actions",
        header: "Aksi",
        cell: ({ row }) => {
          const item = row.original;
          return (
            <div className="flex justify-end gap-2">
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
            </div>
          );
        },
      },
    ],
    [handleEdit]
  );

  // Filter by status and prepare data for table
  const tableData = useMemo(() => {
    let items = productItems;
    
    // Apply status filter
    if (statusFilter === "active") {
      items = items.filter((item) => item.isActive);
    } else if (statusFilter === "inactive") {
      items = items.filter((item) => !item.isActive);
    }
    
    return items;
  }, [productItems, statusFilter]);

  const table = useReactTable({
    data: tableData,
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
      if (!filterValue) return true;
      const item = row.original;
      const searchLower = filterValue.toLowerCase();
      return (
        item.name.toLowerCase().includes(searchLower) ||
        item.skuCode.toLowerCase().includes(searchLower) ||
        item.product.name.toLowerCase().includes(searchLower) ||
        item.product.category.name.toLowerCase().includes(searchLower)
      );
    },
  });

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
                <div className="mb-6">
                  <h1 className="text-3xl font-bold">Kelola Product Items</h1>
                  <p className="mt-2 text-gray-400">
                    Atur dan pantau product items Anda di sini.
                  </p>
                </div>

                <div className="mb-4 flex gap-4">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                    <Input
                      type="text"
                      placeholder="Search..."
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Filter by status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {loading ? (
                  <TableSkeleton columns={7} rows={10} />
                ) : table.getFilteredRowModel().rows.length === 0 ? (
                  <EmptyState
                    icon={PackageSearch}
                    title={search || statusFilter !== "all" ? "No product items found" : "No product items yet"}
                    description={
                      search || statusFilter !== "all"
                        ? "Try adjusting your search or filter criteria to find what you're looking for."
                        : "Product items are created when you sync products from Digiflazz. Sync products to get started."
                    }
                    action={
                      search || statusFilter !== "all"
                        ? {
                            label: "Clear filters",
                            onClick: () => {
                              setSearch("");
                              setStatusFilter("all");
                            },
                          }
                        : undefined
                    }
                  />
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
                          {table.getRowModel().rows.map((row) => (
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
                          ))}
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
                        of {table.getFilteredRowModel().rows.length} product items
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

