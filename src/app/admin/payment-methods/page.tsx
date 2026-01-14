"use client";

import { useState, useMemo, useCallback } from "react";
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
import {
  useAdminPaymentMethods,
  useCreatePaymentMethod,
  useUpdatePaymentMethod,
  useDeletePaymentMethod,
} from "@/lib/queries";
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
import { PaymentMethodType, BankTransferBank, FeeType } from "@prisma/client";

interface PaymentMethod {
  id: string;
  type: PaymentMethodType;
  bank: BankTransferBank | null;
  name: string;
  description: string | null;
  icon: string | null;
  feeType: FeeType;
  feeValue: number;
  vatType: FeeType;
  vatValue: number;
  isActive: boolean;
  sortOrder: number;
  midtransCode: string;
  createdAt: string;
  updatedAt: string;
}

export default function PaymentMethodsPage() {
  const [search, setSearch] = useState("");
  const [sorting, setSorting] = useState<SortingState>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [paymentMethodToDelete, setPaymentMethodToDelete] = useState<PaymentMethod | null>(null);
  const [editingPaymentMethod, setEditingPaymentMethod] = useState<PaymentMethod | null>(null);
  const [formData, setFormData] = useState({
    type: "" as PaymentMethodType | "",
    bank: "" as BankTransferBank | "",
    name: "",
    description: "",
    icon: "",
    feeType: FeeType.PERCENTAGE,
    feeValue: 0,
    vatType: FeeType.PERCENTAGE,
    vatValue: 0,
    isActive: true,
    sortOrder: 0,
    midtransCode: "",
  });

  // Use TanStack Query hooks
  const { data: paymentMethods = [], isLoading: loading } = useAdminPaymentMethods();

  const createPaymentMethodMutation = useCreatePaymentMethod({
    onSuccess: () => {
      toast.success("Payment method created successfully");
      setIsDialogOpen(false);
      resetForm();
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Failed to create payment method");
    },
  });

  const updatePaymentMethodMutation = useUpdatePaymentMethod({
    onSuccess: () => {
      toast.success("Payment method updated successfully");
      setIsDialogOpen(false);
      resetForm();
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Failed to update payment method");
    },
  });

  const deletePaymentMethodMutation = useDeletePaymentMethod({
    onSuccess: () => {
      toast.success("Payment method deleted successfully");
      setIsDeleteDialogOpen(false);
      setPaymentMethodToDelete(null);
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Failed to delete payment method");
    },
  });

  const resetForm = useCallback(() => {
    setEditingPaymentMethod(null);
    setFormData({
      type: "" as PaymentMethodType | "",
      bank: "" as BankTransferBank | "",
      name: "",
      description: "",
      icon: "",
      feeType: FeeType.PERCENTAGE,
      feeValue: 0,
      vatType: FeeType.PERCENTAGE,
      vatValue: 0,
      isActive: true,
      sortOrder: 0,
      midtransCode: "",
    });
  }, []);

  const handleCreate = useCallback(() => {
    resetForm();
    setIsDialogOpen(true);
  }, [resetForm]);

  const handleEdit = useCallback((paymentMethod: PaymentMethod) => {
    setEditingPaymentMethod(paymentMethod);
    setFormData({
      type: paymentMethod.type,
      bank: paymentMethod.bank || ("" as BankTransferBank | ""),
      name: paymentMethod.name,
      description: paymentMethod.description || "",
      icon: paymentMethod.icon || "",
      feeType: paymentMethod.feeType,
      feeValue: paymentMethod.feeValue,
      vatType: paymentMethod.vatType,
      vatValue: paymentMethod.vatValue,
      isActive: paymentMethod.isActive,
      sortOrder: paymentMethod.sortOrder,
      midtransCode: paymentMethod.midtransCode,
    });
    setIsDialogOpen(true);
  }, []);

  const handleDeleteClick = useCallback((paymentMethod: PaymentMethod) => {
    setPaymentMethodToDelete(paymentMethod);
    setIsDeleteDialogOpen(true);
  }, []);

  const handleDeleteConfirm = useCallback(() => {
    if (!paymentMethodToDelete) return;
    deletePaymentMethodMutation.mutate(paymentMethodToDelete.id);
  }, [paymentMethodToDelete, deletePaymentMethodMutation]);

  const handleSubmit = useCallback(() => {
    if (!formData.type || !formData.name || !formData.midtransCode) {
      toast.error("Type, name, and Midtrans code are required");
      return;
    }

    if (formData.type === PaymentMethodType.BANK_TRANSFER && !formData.bank) {
      toast.error("Bank is required for bank transfer payment method");
      return;
    }

    const submitData = {
      ...formData,
      bank: formData.type === PaymentMethodType.BANK_TRANSFER ? formData.bank : null,
    };

    if (editingPaymentMethod) {
      updatePaymentMethodMutation.mutate({
        id: editingPaymentMethod.id,
        data: submitData,
      });
    } else {
      createPaymentMethodMutation.mutate(submitData);
    }
  }, [formData, editingPaymentMethod, createPaymentMethodMutation, updatePaymentMethodMutation]);

  const filteredData = useMemo(() => {
    if (!search) return paymentMethods;
    const searchLower = search.toLowerCase();
    return paymentMethods.filter(
      (pm) =>
        pm.name.toLowerCase().includes(searchLower) ||
        pm.midtransCode.toLowerCase().includes(searchLower) ||
        pm.type.toLowerCase().includes(searchLower)
    );
  }, [paymentMethods, search]);

  const columns = useMemo<ColumnDef<PaymentMethod>[]>(
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
        accessorKey: "type",
        header: ({ column }) => {
          return (
            <Button
              variant="ghost"
              onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
              className="h-8 px-2"
            >
              Type
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
          const type = row.getValue("type") as PaymentMethodType;
          return (
            <div className="text-sm">
              {type.replace(/_/g, " ")}
              {row.original.bank && ` - ${row.original.bank}`}
            </div>
          );
        },
      },
      {
        accessorKey: "midtransCode",
        header: "Midtrans Code",
        cell: ({ row }) => (
          <div className="text-gray-400 text-sm">{row.getValue("midtransCode")}</div>
        ),
      },
      {
        accessorKey: "feeValue",
        header: "Fee",
        cell: ({ row }) => {
          const pm = row.original;
          return (
            <div className="text-sm">
              {pm.feeType === FeeType.PERCENTAGE
                ? `${pm.feeValue}%`
                : `Rp ${pm.feeValue.toLocaleString("id-ID")}`}
            </div>
          );
        },
      },
      {
        accessorKey: "vatValue",
        header: "VAT",
        cell: ({ row }) => {
          const pm = row.original;
          return (
            <div className="text-sm">
              {pm.vatType === FeeType.PERCENTAGE
                ? `${pm.vatValue}%`
                : `Rp ${pm.vatValue.toLocaleString("id-ID")}`}
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
        accessorKey: "sortOrder",
        header: "Sort",
      },
      {
        id: "actions",
        header: "Actions",
        cell: ({ row }) => {
          const paymentMethod = row.original;
          return (
            <div className="flex justify-end gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => handleEdit(paymentMethod)}
              >
                <Pencil className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => handleDeleteClick(paymentMethod)}
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
    },
    initialState: {
      pagination: {
        pageSize: 10,
      },
    },
  });

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <AdminHeader />
        <div className="flex flex-1 flex-col gap-4 overflow-auto">
          <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
            <div className="container mx-auto px-4 lg:px-6">
              <div className="mb-6 flex items-center justify-between">
                <div>
                  <h1 className="text-3xl font-bold">Payment Methods</h1>
                  <p className="mt-2 text-gray-400">
                    Manage payment methods and configure fees & VAT.
                  </p>
                </div>
                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                  <DialogTrigger asChild>
                    <Button onClick={handleCreate}>
                      <Plus className="mr-2 h-4 w-4" />
                      Add Payment Method
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="bg-gray-900 text-gray-100 max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle className="text-gray-100">
                        {editingPaymentMethod ? "Edit Payment Method" : "Add Payment Method"}
                      </DialogTitle>
                      <DialogDescription className="text-gray-400">
                        {editingPaymentMethod
                          ? "Edit payment method configuration."
                          : "Add a new payment method with fee and VAT configuration."}
                      </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                      <div className="grid gap-2">
                        <Label htmlFor="type" className="text-gray-200">
                          Payment Type *
                        </Label>
                        <Select
                          value={formData.type}
                          onValueChange={(value) =>
                            setFormData({
                              ...formData,
                              type: value as PaymentMethodType,
                              bank: value === PaymentMethodType.BANK_TRANSFER ? formData.bank : ("" as BankTransferBank | ""),
                            })
                          }
                        >
                          <SelectTrigger className="bg-gray-800 text-gray-100 border-gray-700">
                            <SelectValue placeholder="Select payment type" />
                          </SelectTrigger>
                          <SelectContent className="bg-gray-800 text-gray-100 border-gray-700">
                            {Object.values(PaymentMethodType).map((type) => (
                              <SelectItem key={type} value={type}>
                                {type.replace(/_/g, " ")}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      {formData.type === PaymentMethodType.BANK_TRANSFER && (
                        <div className="grid gap-2">
                          <Label htmlFor="bank" className="text-gray-200">
                            Bank *
                          </Label>
                          <Select
                            value={formData.bank}
                            onValueChange={(value) =>
                              setFormData({
                                ...formData,
                                bank: value as BankTransferBank,
                              })
                            }
                          >
                            <SelectTrigger className="bg-gray-800 text-gray-100 border-gray-700">
                              <SelectValue placeholder="Select bank" />
                            </SelectTrigger>
                            <SelectContent className="bg-gray-800 text-gray-100 border-gray-700">
                              {Object.values(BankTransferBank).map((bank) => (
                                <SelectItem key={bank} value={bank}>
                                  {bank}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      )}

                      <div className="grid gap-2">
                        <Label htmlFor="name" className="text-gray-200">
                          Name *
                        </Label>
                        <Input
                          id="name"
                          value={formData.name}
                          onChange={(e) =>
                            setFormData({ ...formData, name: e.target.value })
                          }
                          placeholder="e.g. BCA Virtual Account"
                          className="bg-gray-800 text-gray-100 border-gray-700 placeholder:text-gray-500"
                        />
                      </div>

                      <div className="grid gap-2">
                        <Label htmlFor="midtransCode" className="text-gray-200">
                          Midtrans Code *
                        </Label>
                        <Input
                          id="midtransCode"
                          value={formData.midtransCode}
                          onChange={(e) =>
                            setFormData({ ...formData, midtransCode: e.target.value })
                          }
                          placeholder="e.g. bca, gopay, credit_card"
                          className="bg-gray-800 text-gray-100 border-gray-700 placeholder:text-gray-500"
                        />
                      </div>

                      <div className="grid gap-2">
                        <Label htmlFor="description" className="text-gray-200">
                          Description
                        </Label>
                        <Input
                          id="description"
                          value={formData.description}
                          onChange={(e) =>
                            setFormData({ ...formData, description: e.target.value })
                          }
                          placeholder="Optional description"
                          className="bg-gray-800 text-gray-100 border-gray-700 placeholder:text-gray-500"
                        />
                      </div>

                      <div className="grid gap-2">
                        <Label htmlFor="icon" className="text-gray-200">
                          Icon URL
                        </Label>
                        <Input
                          id="icon"
                          value={formData.icon}
                          onChange={(e) =>
                            setFormData({ ...formData, icon: e.target.value })
                          }
                          placeholder="https://example.com/icon.png"
                          className="bg-gray-800 text-gray-100 border-gray-700 placeholder:text-gray-500"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-2">
                          <Label htmlFor="feeType" className="text-gray-200">
                            Fee Type
                          </Label>
                          <Select
                            value={formData.feeType}
                            onValueChange={(value) =>
                              setFormData({
                                ...formData,
                                feeType: value as FeeType,
                              })
                            }
                          >
                            <SelectTrigger className="bg-gray-800 text-gray-100 border-gray-700">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="bg-gray-800 text-gray-100 border-gray-700">
                              <SelectItem value={FeeType.PERCENTAGE}>Percentage</SelectItem>
                              <SelectItem value={FeeType.FIXED}>Fixed Amount</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="grid gap-2">
                          <Label htmlFor="feeValue" className="text-gray-200">
                            Fee Value
                          </Label>
                          <Input
                            id="feeValue"
                            type="number"
                            step="0.01"
                            value={formData.feeValue}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                feeValue: parseFloat(e.target.value) || 0,
                              })
                            }
                            placeholder={formData.feeType === FeeType.PERCENTAGE ? "2.5" : "5000"}
                            className="bg-gray-800 text-gray-100 border-gray-700 placeholder:text-gray-500"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-2">
                          <Label htmlFor="vatType" className="text-gray-200">
                            VAT Type
                          </Label>
                          <Select
                            value={formData.vatType}
                            onValueChange={(value) =>
                              setFormData({
                                ...formData,
                                vatType: value as FeeType,
                              })
                            }
                          >
                            <SelectTrigger className="bg-gray-800 text-gray-100 border-gray-700">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="bg-gray-800 text-gray-100 border-gray-700">
                              <SelectItem value={FeeType.PERCENTAGE}>Percentage</SelectItem>
                              <SelectItem value={FeeType.FIXED}>Fixed Amount</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="grid gap-2">
                          <Label htmlFor="vatValue" className="text-gray-200">
                            VAT Value
                          </Label>
                          <Input
                            id="vatValue"
                            type="number"
                            step="0.01"
                            value={formData.vatValue}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                vatValue: parseFloat(e.target.value) || 0,
                              })
                            }
                            placeholder={formData.vatType === FeeType.PERCENTAGE ? "11" : "500"}
                            className="bg-gray-800 text-gray-100 border-gray-700 placeholder:text-gray-500"
                          />
                        </div>
                      </div>

                      <div className="grid gap-2">
                        <Label htmlFor="sortOrder" className="text-gray-200">
                          Sort Order
                        </Label>
                        <Input
                          id="sortOrder"
                          type="number"
                          value={formData.sortOrder}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              sortOrder: parseInt(e.target.value) || 0,
                            })
                          }
                          className="bg-gray-800 text-gray-100 border-gray-700 placeholder:text-gray-500"
                        />
                      </div>

                      <div className="flex items-center gap-2">
                        <Checkbox
                          id="isActive"
                          checked={formData.isActive}
                          onCheckedChange={(checked) =>
                            setFormData({ ...formData, isActive: !!checked })
                          }
                        />
                        <Label htmlFor="isActive" className="text-gray-200">
                          Active
                        </Label>
                      </div>
                    </div>
                    <DialogFooter>
                      <Button
                        variant="outline"
                        onClick={() => setIsDialogOpen(false)}
                      >
                        Cancel
                      </Button>
                      <Button onClick={handleSubmit}>Save</Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>

                {/* Delete Confirmation Dialog */}
                <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                  <DialogContent className="bg-gray-900 text-gray-100">
                    <DialogHeader>
                      <DialogTitle className="text-gray-100">
                        Delete Payment Method
                      </DialogTitle>
                      <DialogDescription className="text-gray-400">
                        Are you sure you want to delete payment method{" "}
                        <span className="font-semibold text-gray-200">
                          {paymentMethodToDelete?.name}
                        </span>
                        ? This action cannot be undone.
                      </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                      <Button
                        variant="outline"
                        onClick={() => {
                          setIsDeleteDialogOpen(false);
                          setPaymentMethodToDelete(null);
                        }}
                        className="bg-gray-800 text-gray-200 border-gray-700 hover:bg-gray-700"
                      >
                        Cancel
                      </Button>
                      <Button
                        onClick={handleDeleteConfirm}
                        className="bg-red-600 text-white hover:bg-red-700"
                      >
                        Delete
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
                    placeholder="Search by name, type, or code..."
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
                              No payment methods found
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </div>
                  <div className="flex items-center justify-between px-2 py-4">
                    <div className="text-sm text-gray-400">
                      Showing{" "}
                      {table.getState().pagination.pageIndex *
                        table.getState().pagination.pageSize +
                        1}{" "}
                      to{" "}
                      {Math.min(
                        (table.getState().pagination.pageIndex + 1) *
                          table.getState().pagination.pageSize,
                        table.getFilteredRowModel().rows.length
                      )}{" "}
                      of {table.getFilteredRowModel().rows.length} payment methods
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
      </SidebarInset>
    </SidebarProvider>
  );
}

