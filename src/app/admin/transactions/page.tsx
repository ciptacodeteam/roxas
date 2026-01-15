"use client";

import { useState, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Search, Eye, ArrowUpDown, ArrowUp, ArrowDown, Download, FileDown } from "lucide-react";
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
import { useAdminTransactions } from "@/lib/queries";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { formatDateTime } from "@/lib/date-utils";
import { exportToCSV, formatTransactionForExport } from "@/lib/export-utils";
import { toast } from "sonner";
import { TableSkeleton } from "@/components/admin/table-skeleton";
import { EmptyState } from "@/components/admin/empty-state";
import { Receipt, RefreshCw } from "lucide-react";

interface Transaction {
  id: string;
  orderNumber: string;
  userId: string;
  productItemId: string;
  customerData: Record<string, unknown>;
  originalPrice: number;
  finalPrice: number;
  status: string;
  createdAt: string;
  updatedAt: string;
  paidAt: string | null;
  completedAt: string | null;
  user: {
    id: string;
    email: string;
    name: string | null;
    phone: string | null;
  };
  productItem: {
    id: string;
    name: string;
    product: {
      id: string;
      name: string;
      category: {
        id: string;
        name: string;
      };
    };
  };
  payment: {
    id: string;
    transactionId: string | null;
    paymentMethodId: string | null;
    paymentMethod: {
      id: string;
      name: string;
      type: string;
      bank: string | null;
    } | null;
    status: string | null;
    amount: number;
    paidAt: string | null;
    expiresAt: string | null;
  } | null;
  digiflazzTx: {
    id: string;
    refId: string;
    trxId: string | null;
    status: string;
    message: string | null;
    serialNumber: string | null;
  } | null;
}

export default function TransactionsPage() {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [paymentStatusFilter, setPaymentStatusFilter] = useState<string>("all");
  const [sorting, setSorting] = useState<SortingState>([]);

  const handleView = useCallback((transaction: Transaction) => {
    router.push(`/admin/transactions/${transaction.id}`);
  }, [router]);

  // Use TanStack Query hook with filters
  const { data: transactionsData, isLoading: loading } = useAdminTransactions({
    status: statusFilter !== "all" ? statusFilter : undefined,
    paymentStatus: paymentStatusFilter !== "all" ? paymentStatusFilter : undefined,
  });

  const transactions: Transaction[] = transactionsData || [];

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

  const getPaymentStatusColor = (status: string | null) => {
    if (!status) return "bg-gray-600/20 text-gray-400";
    const colors: Record<string, string> = {
      pending: "bg-yellow-600/20 text-yellow-400",
      settlement: "bg-green-600/20 text-green-400",
      expire: "bg-gray-600/20 text-gray-400",
      cancel: "bg-red-600/20 text-red-400",
      deny: "bg-red-600/20 text-red-400",
      refund: "bg-orange-600/20 text-orange-400",
    };
    return colors[status.toLowerCase()] || "bg-gray-600/20 text-gray-400";
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(price);
  };

  const columns = useMemo<ColumnDef<Transaction>[]>(
    () => [
      {
        accessorKey: "orderNumber",
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
          <div className="font-medium">{row.getValue("orderNumber")}</div>
        ),
      },
      {
        accessorKey: "user.email",
        header: "User",
        cell: ({ row }) => {
          const user = row.original.user;
          return (
            <div>
              <div className="font-medium">{user.email}</div>
              {user.name && (
                <div className="text-sm text-gray-400">{user.name}</div>
              )}
            </div>
          );
        },
      },
      {
        accessorKey: "productItem.product.name",
        header: "Product",
        cell: ({ row }) => {
          const productItem = row.original.productItem;
          return (
            <div>
              <div className="font-medium">{productItem.product.name}</div>
              <div className="text-sm text-gray-400">{productItem.name}</div>
            </div>
          );
        },
      },
      {
        accessorKey: "finalPrice",
        header: ({ column }) => {
          return (
            <Button
              variant="ghost"
              onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
              className="h-8 px-2"
            >
              Amount
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
          const transaction = row.original;
          return (
            <div>
              <div className="font-medium">{formatPrice(transaction.finalPrice)}</div>
              {transaction.payment && (
                <div className="text-sm text-gray-400">
                  Paid: {formatPrice(transaction.payment.amount)}
                </div>
              )}
            </div>
          );
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
              Order Status
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
        accessorKey: "payment.status",
        header: "Payment Status",
        cell: ({ row }) => {
          const payment = row.original.payment;
          if (!payment) return <span className="text-gray-400">-</span>;
          return (
            <div>
              <span className={`rounded px-2 py-1 text-xs font-semibold ${getPaymentStatusColor(payment.status)}`}>
                {payment.status?.toUpperCase() || "-"}
              </span>
              {payment.paymentMethod && (
                <div className="text-xs text-gray-400 mt-1">{payment.paymentMethod.name}</div>
              )}
            </div>
          );
        },
      },
      {
        accessorKey: "digiflazzTx.status",
        header: "Digiflazz Status",
        cell: ({ row }) => {
          const digiflazzTx = row.original.digiflazzTx;
          if (!digiflazzTx) return <span className="text-gray-400">-</span>;
          return (
            <div>
              <div className="text-sm">{digiflazzTx.status}</div>
              {digiflazzTx.trxId && (
                <div className="text-xs text-gray-400">ID: {digiflazzTx.trxId}</div>
              )}
            </div>
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
          const transaction = row.original;
          return (
            <div className="flex justify-end gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => handleView(transaction)}
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
    data: transactions,
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
      const transaction = row.original;
      const searchLower = filterValue.toLowerCase();
      return (
        transaction.orderNumber.toLowerCase().includes(searchLower) ||
        transaction.user.email.toLowerCase().includes(searchLower) ||
        (transaction.user.name?.toLowerCase().includes(searchLower) || false) ||
        transaction.productItem.product.name.toLowerCase().includes(searchLower) ||
        transaction.productItem.name.toLowerCase().includes(searchLower) ||
        (transaction.payment?.transactionId?.toLowerCase().includes(searchLower) || false) ||
        (transaction.digiflazzTx?.trxId?.toLowerCase().includes(searchLower) || false)
      );
    },
  });

  const handleExportCSV = useCallback(() => {
    try {
      const filteredTransactions = table.getFilteredRowModel().rows.map((row) => row.original);
      if (filteredTransactions.length === 0) {
        toast.error("No data to export");
        return;
      }

      const exportData = filteredTransactions.map(formatTransactionForExport);
      exportToCSV(exportData, "transactions");
      toast.success(`Exported ${filteredTransactions.length} transactions to CSV`);
    } catch (error) {
      toast.error("Failed to export transactions", {
        description: error instanceof Error ? error.message : "Please try again",
      });
    }
  }, [table]);

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
                    <h1 className="text-3xl font-bold">Kelola Transactions</h1>
                    <p className="mt-2 text-gray-400">
                      Lihat dan pantau semua transaksi pembayaran dan topup di sini.
                    </p>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="outline"
                        disabled={loading || transactions.length === 0}
                      >
                        <FileDown className="mr-2 h-4 w-4" />
                        Export
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={handleExportCSV}>
                        <Download className="mr-2 h-4 w-4" />
                        Export as CSV
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
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
                      <SelectValue placeholder="Order status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Orders</SelectItem>
                      <SelectItem value="PENDING">Pending</SelectItem>
                      <SelectItem value="PAID">Paid</SelectItem>
                      <SelectItem value="PROCESSING">Processing</SelectItem>
                      <SelectItem value="COMPLETED">Completed</SelectItem>
                      <SelectItem value="FAILED">Failed</SelectItem>
                      <SelectItem value="REFUNDED">Refunded</SelectItem>
                      <SelectItem value="EXPIRED">Expired</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={paymentStatusFilter} onValueChange={setPaymentStatusFilter}>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Payment status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Payments</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="settlement">Settlement</SelectItem>
                      <SelectItem value="expire">Expired</SelectItem>
                      <SelectItem value="cancel">Cancelled</SelectItem>
                      <SelectItem value="deny">Denied</SelectItem>
                      <SelectItem value="refund">Refunded</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {loading ? (
                  <TableSkeleton columns={8} rows={10} />
                ) : table.getFilteredRowModel().rows.length === 0 ? (
                  <EmptyState
                    icon={search || statusFilter !== "all" || paymentStatusFilter !== "all" ? Receipt : Receipt}
                    title={search || statusFilter !== "all" || paymentStatusFilter !== "all" ? "No transactions found" : "No transactions yet"}
                    description={
                      search || statusFilter !== "all" || paymentStatusFilter !== "all"
                        ? "Try adjusting your search or filter criteria to find what you're looking for."
                        : "Transactions will appear here once customers complete their orders and payments are processed."
                    }
                    action={
                      search || statusFilter !== "all" || paymentStatusFilter !== "all"
                        ? {
                            label: "Clear filters",
                            onClick: () => {
                              setSearch("");
                              setStatusFilter("all");
                              setPaymentStatusFilter("all");
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
                        of {table.getFilteredRowModel().rows.length} transactions
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

