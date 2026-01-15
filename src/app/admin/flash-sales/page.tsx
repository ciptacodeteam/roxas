"use client";

import { useState, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Search, Plus, Pencil, Trash2, ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";
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
import { useAdminFlashSales, useDeleteFlashSale } from "@/lib/queries";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { formatDateTime } from "@/lib/date-utils";
import { TableSkeleton } from "@/components/admin/table-skeleton";
import { EmptyState } from "@/components/admin/empty-state";
import { Zap } from "lucide-react";

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
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [sorting, setSorting] = useState<SortingState>([]);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [flashSaleToDelete, setFlashSaleToDelete] = useState<FlashSale | null>(null);

  // Use TanStack Query hooks
  const { data: flashSales = [], isLoading: loading } = useAdminFlashSales();

  const deleteFlashSaleMutation = useDeleteFlashSale({
    onSuccess: () => {
      toast.success("Flash sale deleted successfully");
      setIsDeleteDialogOpen(false);
      setFlashSaleToDelete(null);
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Failed to delete flash sale");
    },
  });

  const handleEdit = useCallback((flashSale: FlashSale) => {
    router.push(`/admin/flash-sales/${flashSale.id}`);
  }, [router]);

  const handleDeleteClick = useCallback((flashSale: FlashSale) => {
    setFlashSaleToDelete(flashSale);
    setIsDeleteDialogOpen(true);
  }, []);

  const handleDeleteConfirm = useCallback(() => {
    if (!flashSaleToDelete) return;
    deleteFlashSaleMutation.mutate(flashSaleToDelete.id);
  }, [flashSaleToDelete, deleteFlashSaleMutation]);

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
          const date = row.getValue("startTime") as string;
          return date ? formatDateTime(date) : "-";
        },
      },
      {
        accessorKey: "endTime",
        header: "End Time",
        cell: ({ row }) => {
          const date = row.getValue("endTime") as string;
          return date ? formatDateTime(date) : "-";
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
                  <Button onClick={() => router.push("/admin/flash-sales/new")}>
                    <Plus className="mr-2 h-4 w-4" />
                    Tambah
                  </Button>
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
                  <TableSkeleton columns={6} rows={10} />
                ) : table.getFilteredRowModel().rows.length === 0 ? (
                  <EmptyState
                    icon={Zap}
                    title={search ? "No flash sales found" : "No flash sales yet"}
                    description={
                      search
                        ? "Try adjusting your search criteria to find what you're looking for."
                        : "Create flash sales to offer limited-time discounts on products. Flash sales can boost sales and attract customers."
                    }
                    action={
                      search
                        ? {
                            label: "Clear search",
                            onClick: () => setSearch(""),
                          }
                        : {
                            label: "Create flash sale",
                            onClick: () => router.push("/admin/flash-sales/new"),
                          }
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

        {/* Delete Confirmation Dialog */}
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
      </SidebarInset>
    </SidebarProvider>
  );
}

