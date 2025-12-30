"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { Loader2, Search, Pencil, ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";
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
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Order {
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
    paymentMethod: string | null;
    paymentChannel: string | null;
    status: string | null;
    amount: number;
    paidAt: string | null;
  } | null;
  digiflazzTx: {
    id: string;
    refId: string;
    trxId: string | null;
    status: string;
    message: string | null;
  } | null;
}

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [sorting, setSorting] = useState<SortingState>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingOrder, setEditingOrder] = useState<Order | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<string>("");

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const url = statusFilter !== "all" 
        ? `/api/admin/orders?status=${statusFilter}`
        : "/api/admin/orders";
      const response = await fetch(url);
      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Failed to fetch orders");
      }

      setOrders(data.data || []);
    } catch (err) {
      console.error("Error fetching orders:", err);
      toast.error("Failed to load orders");
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [statusFilter]);

  const handleEdit = useCallback((order: Order) => {
    setEditingOrder(order);
    setSelectedStatus(order.status);
    setIsDialogOpen(true);
  }, []);

  const handleStatusUpdate = async () => {
    if (!editingOrder) return;

    try {
      const response = await fetch(`/api/admin/orders/${editingOrder.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: selectedStatus }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Failed to update order");
      }

      toast.success("Order status updated");
      setIsDialogOpen(false);
      setEditingOrder(null);
      fetchOrders();
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to update order"
      );
    }
  };

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

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(price);
  };

  const columns = useMemo<ColumnDef<Order>[]>(
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
          const order = row.original;
          return (
            <div>
              <div className="font-medium">{formatPrice(order.finalPrice)}</div>
              {order.originalPrice !== order.finalPrice && (
                <div className="text-sm text-gray-400 line-through">
                  {formatPrice(order.originalPrice)}
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
        accessorKey: "payment.status",
        header: "Payment",
        cell: ({ row }) => {
          const payment = row.original.payment;
          if (!payment) return <span className="text-gray-400">-</span>;
          return (
            <div>
              <div className="text-sm">{payment.status || "-"}</div>
              {payment.paymentMethod && (
                <div className="text-xs text-gray-400">{payment.paymentMethod}</div>
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
          const date = new Date(row.getValue("createdAt"));
          return (
            <div>
              <div>{date.toLocaleDateString("id-ID")}</div>
              <div className="text-xs text-gray-400">{date.toLocaleTimeString("id-ID")}</div>
            </div>
          );
        },
      },
      {
        id: "actions",
        header: "Aksi",
        cell: ({ row }) => {
          const order = row.original;
          return (
            <div className="flex justify-end gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => handleEdit(order)}
              >
                <Pencil className="h-4 w-4" />
              </Button>
            </div>
          );
        },
      },
    ],
    [handleEdit]
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
      return (
        order.orderNumber.toLowerCase().includes(searchLower) ||
        order.user.email.toLowerCase().includes(searchLower) ||
        (order.user.name?.toLowerCase().includes(searchLower) || false) ||
        order.productItem.product.name.toLowerCase().includes(searchLower) ||
        order.productItem.name.toLowerCase().includes(searchLower)
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
                  <h1 className="text-3xl font-bold">Kelola Orders</h1>
                  <p className="mt-2 text-gray-400">
                    Atur dan pantau pesanan Anda di sini.
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
                                No orders found
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

      {/* Edit Order Status Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="bg-gray-900 text-gray-100">
          <DialogHeader>
            <DialogTitle className="text-gray-100">Update Order Status</DialogTitle>
            <DialogDescription className="text-gray-400">
              Update the status of order {editingOrder?.orderNumber}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="status" className="text-gray-200">Status</Label>
              <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                <SelectTrigger className="bg-gray-800 text-gray-100 border-gray-700">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent className="bg-gray-800 text-gray-100 border-gray-700">
                  <SelectItem value="PENDING" className="text-gray-100 hover:bg-gray-700">
                    PENDING
                  </SelectItem>
                  <SelectItem value="PAID" className="text-gray-100 hover:bg-gray-700">
                    PAID
                  </SelectItem>
                  <SelectItem value="PROCESSING" className="text-gray-100 hover:bg-gray-700">
                    PROCESSING
                  </SelectItem>
                  <SelectItem value="COMPLETED" className="text-gray-100 hover:bg-gray-700">
                    COMPLETED
                  </SelectItem>
                  <SelectItem value="FAILED" className="text-gray-100 hover:bg-gray-700">
                    FAILED
                  </SelectItem>
                  <SelectItem value="REFUNDED" className="text-gray-100 hover:bg-gray-700">
                    REFUNDED
                  </SelectItem>
                  <SelectItem value="EXPIRED" className="text-gray-100 hover:bg-gray-700">
                    EXPIRED
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            {editingOrder && (
              <div className="space-y-2 text-sm">
                <div>
                  <span className="text-gray-400">User:</span> {editingOrder.user.email}
                </div>
                <div>
                  <span className="text-gray-400">Product:</span> {editingOrder.productItem.product.name}
                </div>
                <div>
                  <span className="text-gray-400">Price:</span> {formatPrice(editingOrder.finalPrice)}
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsDialogOpen(false);
                setEditingOrder(null);
              }}
              className="bg-gray-800 text-gray-200 border-gray-700 hover:bg-gray-700"
            >
              Batal
            </Button>
            <Button onClick={handleStatusUpdate}>Update Status</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </SidebarProvider>
  );
}

