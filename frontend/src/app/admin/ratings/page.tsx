"use client";

import { useState, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Search, Pencil, Trash2, ArrowUpDown, ArrowUp, ArrowDown, Star } from "lucide-react";
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
  useAdminRatings,
  useDeleteRating,
} from "@/lib/queries";
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

interface Rating {
  id: string;
  productId: string;
  rating: number;
  comment: string | null;
  userName: string | null;
  isActive: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
  product: {
    id: string;
    name: string;
    slug: string;
  };
}

export default function RatingsPage() {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [sorting, setSorting] = useState<SortingState>([]);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [ratingToDelete, setRatingToDelete] = useState<Rating | null>(null);

  const { data: ratingsData = [], isLoading: loading } = useAdminRatings({ search });
  const ratings: Rating[] = ratingsData;

  const deleteRatingMutation = useDeleteRating({
    onSuccess: () => {
      toast.success("Rating deleted successfully");
      setIsDeleteDialogOpen(false);
      setRatingToDelete(null);
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Failed to delete rating");
    },
  });

  const handleEdit = useCallback((rating: Rating) => {
    router.push(`/admin/ratings/${rating.id}`);
  }, [router]);

  const handleDeleteClick = useCallback((rating: Rating) => {
    setRatingToDelete(rating);
    setIsDeleteDialogOpen(true);
  }, []);

  const handleDeleteConfirm = useCallback(() => {
    if (!ratingToDelete) return;
    deleteRatingMutation.mutate(ratingToDelete.id);
  }, [ratingToDelete, deleteRatingMutation]);

  const filteredData = useMemo(() => {
    if (search.trim() === "") {
      return ratings;
    }
    const searchLower = search.toLowerCase();
    return ratings.filter(
      (rating) =>
        rating.userName?.toLowerCase().includes(searchLower) ||
        rating.comment?.toLowerCase().includes(searchLower) ||
        rating.product.name.toLowerCase().includes(searchLower)
    );
  }, [ratings, search]);

  const columns = useMemo<ColumnDef<Rating>[]>(
    () => [
      {
        accessorKey: "product.name",
        header: ({ column }) => {
          return (
            <Button
              variant="ghost"
              onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
              className="h-8 px-2"
            >
              Product
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
          <div className="font-medium">{row.original.product.name}</div>
        ),
      },
      {
        accessorKey: "rating",
        header: ({ column }) => {
          return (
            <Button
              variant="ghost"
              onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
              className="h-8 px-2"
            >
              Rating
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
          const rating = row.getValue("rating") as number;
          return (
            <div className="flex items-center gap-1">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  className={`h-4 w-4 ${
                    i < rating ? "fill-yellow-400 text-yellow-400" : "text-gray-600"
                  }`}
                />
              ))}
              <span className="ml-2 text-sm font-semibold">{rating}/5</span>
            </div>
          );
        },
      },
      {
        accessorKey: "userName",
        header: "Reviewer",
        cell: ({ row }) => (
          <div className="text-sm">{row.getValue("userName") || "Anonymous"}</div>
        ),
      },
      {
        accessorKey: "comment",
        header: "Comment",
        cell: ({ row }) => (
          <div className="max-w-md text-sm text-gray-400">
            {row.getValue("comment") || "-"}
          </div>
        ),
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
        accessorKey: "createdAt",
        header: "Created",
        cell: ({ row }) => {
          const date = row.getValue("createdAt") as string;
          return formatDateTime(date);
        },
      },
      {
        id: "actions",
        header: "Aksi",
        cell: ({ row }) => {
          const rating = row.original;
          return (
            <div className="flex justify-end gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => handleEdit(rating)}
              >
                <Pencil className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => handleDeleteClick(rating)}
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
    data: filteredData,
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
      const rating = row.original;
      const searchLower = filterValue.toLowerCase();
      return (
        rating.userName?.toLowerCase().includes(searchLower) ||
        rating.comment?.toLowerCase().includes(searchLower) ||
        rating.product.name.toLowerCase().includes(searchLower)
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
                  <div>
                    <h1 className="text-3xl font-bold">Kelola Ratings</h1>
                    <p className="mt-2 text-gray-400">
                      Atur dan pantau rating produk Anda di sini.
                    </p>
                  </div>
                </div>

                <div className="mb-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                    <Input
                      type="text"
                      placeholder="Search by reviewer, comment, or product..."
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>

                {loading ? (
                  <TableSkeleton columns={7} rows={10} />
                ) : table.getFilteredRowModel().rows.length === 0 ? (
                  <EmptyState
                    icon={Star}
                    title={search ? "No ratings found" : "No ratings yet"}
                    description={
                      search
                        ? "Try adjusting your search criteria to find what you're looking for."
                        : "No ratings have been added yet. Ratings can only be managed through the edit page."
                    }
                    action={
                      search
                        ? {
                            label: "Clear search",
                            onClick: () => setSearch(""),
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
                        of {table.getFilteredRowModel().rows.length} ratings
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
        <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <DialogContent className="bg-gray-900 text-gray-100">
            <DialogHeader>
              <DialogTitle className="text-gray-100">Delete Rating</DialogTitle>
              <DialogDescription className="text-gray-400">
                Are you sure you want to delete this rating for{" "}
                <span className="font-semibold text-gray-200">
                  {ratingToDelete?.product.name}
                </span>
                ?
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setIsDeleteDialogOpen(false);
                  setRatingToDelete(null);
                }}
                className="bg-gray-800 text-gray-200 border-gray-700 hover:bg-gray-700"
              >
                Cancel
              </Button>
              <Button
                onClick={handleDeleteConfirm}
                className="bg-red-600 text-white hover:bg-red-700"
                disabled={deleteRatingMutation.isPending}
              >
                {deleteRatingMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  "Delete"
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </SidebarInset>
    </SidebarProvider>
  );
}

