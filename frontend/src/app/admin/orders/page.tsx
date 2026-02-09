"use client";

import { useState, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Search, Eye, ArrowUpDown, ArrowUp, ArrowDown, Download } from "lucide-react";
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
import { useAdminOrders } from "@/lib/queries";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatDateTime } from "@/lib/date-utils";
import { toast } from "sonner";
import { TableSkeleton } from "@/components/admin/table-skeleton";
import { EmptyState } from "@/components/admin/empty-state";
import { PackageSearch } from "lucide-react";

export default function OrdersPage() {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [sorting, setSorting] = useState<SortingState>([]);

  // Use TanStack Query hooks
  const { data: orders = [], isLoading: loading, refetch } = useAdminOrders(
    { status: statusFilter !== "all" ? statusFilter : undefined },
    {
      refetchOnMount: "always",
      refetchOnWindowFocus: true,
      staleTime: 0,
    }
  );

  const handleView = useCallback((order: any) => {
    router.push(`/admin/orders/${order.id}`);
  }, [router]);

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      PENDING: "bg-yellow-600/20 text-yellow-400",
      PAID: "bg-blue-600/20 text-blue-400",
      PROCESSING: "bg-purple-600/20 text-purple-400",
      COMPLETED: "bg-green-600/20 text-green-400",
      FAILED: "bg-red-600/20 text-red-400",
      REFUNDED: "bg-orange-600/20 text-orange-400",
      EXPIRED: "bg-gray-600/20 text-gray-400",
    };
    return colors[status] || "bg-gray-600/20 text-gray-400";
  };

  const getPaymentStatusColor = (status: string) => {
    if (!status) return "bg-gray-600/20 text-gray-400";
    const s = String(status).toUpperCase();
    const colors: Record<string, string> = {
      PENDING: "bg-yellow-600/20 text-yellow-400",
      SETTLEMENT: "bg-green-600/20 text-green-400",
      SUCCESS: "bg-green-600/20 text-green-400",
      CAPTURE: "bg-green-600/20 text-green-400",
      EXPIRE: "bg-gray-600/20 text-gray-400",
      EXPIRED: "bg-gray-600/20 text-gray-400",
      CANCEL: "bg-orange-600/20 text-orange-400",
      CANCELLED: "bg-orange-600/20 text-orange-400",
      DENY: "bg-red-600/20 text-red-400",
      DENIED: "bg-red-600/20 text-red-400",
      REFUND: "bg-orange-600/20 text-orange-400",
      REFUNDED: "bg-orange-600/20 text-orange-400",
      FAILURE: "bg-red-600/20 text-red-400",
      FAILED: "bg-red-600/20 text-red-400",
    };
    return colors[s] || "bg-gray-600/20 text-gray-400";
  };

  const getDigiflazzStatusColor = (status: string) => {
    if (!status) return "bg-gray-600/20 text-gray-400";
    const s = String(status).toUpperCase();
    const colors: Record<string, string> = {
      PENDING: "bg-yellow-600/20 text-yellow-400",
      SUKSES: "bg-green-600/20 text-green-400",
      SUCCESS: "bg-green-600/20 text-green-400",
      GAGAL: "bg-red-600/20 text-red-400",
      FAILED: "bg-red-600/20 text-red-400",
    };
    return colors[s] || "bg-gray-600/20 text-gray-400";
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(price);
  };

  const columns = useMemo<ColumnDef<any>[]>(
    () => [
      {
        accessorKey: "order_number",
        header: ({ column }) => {
          return (
            <Button
              variant="ghost"
              onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
              className="h-8 px-2"
            >
              Order Number
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
          <div className="font-medium">{row.getValue("order_number")}</div>
        ),
      },
      {
        accessorKey: "user_email",
        header: "Customer",
        cell: ({ row }) => {
          const email = row.original.user_email ?? row.original.user?.email;
          const name = row.original.user_name ?? row.original.user?.name;
          return (
            <div>
              {name != null && name !== "" && (
                <div className="font-medium">{name}</div>
              )}
              <div className={name ? "text-sm text-gray-400" : "font-medium"}>
                {email ?? "-"}
              </div>
            </div>
          );
        },
      },
      {
        accessorKey: "product_item",
        header: "Product",
        cell: ({ row }) => {
          const productItem = row.original.product_item;
          return (
            <div>
              <div className="font-medium">{productItem.product.name}</div>
              <div className="text-sm text-gray-400">{productItem.name}</div>
            </div>
          );
        },
      },
      {
        accessorKey: "total_amount",
        header: ({ column }) => {
          return (
            <Button
              variant="ghost"
              onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
              className="h-8 px-2"
            >
              Total
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
          return formatPrice(row.getValue("total_amount"));
        },
      },
      {
        accessorKey: "status",
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
          const status = row.getValue("status") as string;
          return (
            <span className={`rounded px-2 py-1 text-xs font-semibold ${getStatusColor(status)}`}>
              {status}
            </span>
          );
        },
      },
      {
        accessorKey: "payment",
        header: "Payment",
        cell: ({ row }) => {
          const payment = row.original.payment;
          if (!payment) return <span className="text-gray-400">-</span>;
          const payStatus = payment.status || "-";
          return (
            <div className="space-y-1">
              <span
                className={`inline-block rounded px-2 py-1 text-xs font-semibold ${getPaymentStatusColor(payStatus)}`}
              >
                {payStatus}
              </span>
              {payment.payment_method && (
                <div className="text-xs text-gray-400">{payment.payment_method.name}</div>
              )}
            </div>
          );
        },
      },
      {
        accessorKey: "digiflazz_transaction",
        header: "Digiflazz",
        cell: ({ row }) => {
          const df = row.original.digiflazz_transaction;
          if (!df) return <span className="text-gray-400">-</span>;
          const dfStatus = df.status || "-";
          return (
            <span
              className={`inline-block rounded px-2 py-1 text-xs font-semibold ${getDigiflazzStatusColor(dfStatus)}`}
            >
              {dfStatus}
            </span>
          );
        },
      },
      {
        accessorKey: "created_at",
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
          const date = row.getValue("created_at") as string;
          return date ? formatDateTime(date) : "-";
        },
      },
      {
        id: "actions",
        header: "Actions",
        cell: ({ row }) => {
          const order = row.original;
          return (
            <div className="flex justify-end gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => handleView(order)}
              >
                <Eye className="h-4 w-4" />
              </Button>
            </div>
          );
        },
      },
    ],
    [handleView]
  );

  const table = useReactTable({
    data: orders,
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
      const order = row.original;
      const searchLower = filterValue.toLowerCase();
      const email = order.user_email ?? order.user?.email ?? "";
      const name = order.user_name ?? order.user?.name ?? "";
      return (
        (order.order_number ?? "").toLowerCase().includes(searchLower) ||
        email.toLowerCase().includes(searchLower) ||
        name.toLowerCase().includes(searchLower) ||
        (order.product_item?.product?.name ?? "").toLowerCase().includes(searchLower) ||
        (order.product_item?.name ?? "").toLowerCase().includes(searchLower)
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
                <div className="mb-6 flex items-center justify-between">
                  <div>
                    <h1 className="text-3xl font-bold">Orders</h1>
                    <p className="mt-2 text-gray-400">
                      View and manage customer orders.
                    </p>
                  </div>
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
                      <SelectItem value="PENDING">Pending</SelectItem>
                      <SelectItem value="PAID">Paid</SelectItem>
                      <SelectItem value="PROCESSING">Processing</SelectItem>
                      <SelectItem value="COMPLETED">Completed</SelectItem>
                      <SelectItem value="FAILED">Failed</SelectItem>
                      <SelectItem value="REFUNDED">Refunded</SelectItem>
                      <SelectItem value="EXPIRED">Expired</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {loading ? (
                  <TableSkeleton columns={9} rows={10} />
                ) : table.getFilteredRowModel().rows.length === 0 ? (
                  <EmptyState
                    icon={PackageSearch}
                    title={search || statusFilter !== "all" ? "No orders found" : "No orders yet"}
                    description={
                      search || statusFilter !== "all"
                        ? "Try adjusting your search or filter criteria to find what you're looking for."
                        : "Orders will appear here once customers start placing them."
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
                        of {table.getFilteredRowModel().rows.length} orders
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