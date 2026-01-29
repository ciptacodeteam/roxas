"use client";

import { useState, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Search, Plus, Pencil, Trash2, ArrowUpDown, ArrowUp, ArrowDown, Ban, CheckCircle, ChevronDown } from "lucide-react";
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
  useStaffUsers, 
  useCustomerUsers, 
  useToggleUserActive,
  type StaffUser,
  type CustomerUser,
} from "@/lib/users";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type CombinedUser = (StaffUser | CustomerUser) & {
  userType: "STAFF" | "CUSTOMER";
};

export default function UsersPage() {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [sorting, setSorting] = useState<SortingState>([]);
  const [isToggleDialogOpen, setIsToggleDialogOpen] = useState(false);
  const [userToToggle, setUserToToggle] = useState<CombinedUser | null>(null);

  // Fetch staff and customer users
  const { 
    data: staffData, 
    isLoading: staffLoading,
    refetch: staffRefetch
  } = useStaffUsers({ 
    search: search || undefined,
    page_size: 100 
  });
  
  const { 
    data: customerData, 
    isLoading: customerLoading,
    refetch: customerRefetch
  } = useCustomerUsers({ 
    search: search || undefined,
    page_size: 100 
  });

  const isLoading = staffLoading || customerLoading;

  const toggleUserMutation = useToggleUserActive({
    onSuccess: () => {
      toast.success("User status updated successfully");
      setIsToggleDialogOpen(false);
      setUserToToggle(null);
      // Force refetch both queries
      staffRefetch();
      customerRefetch();
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Failed to update user status");
    },
  });

  // Combine staff and customer users
  const allUsers = useMemo<CombinedUser[]>(() => {
    const staff = (staffData?.results || []).map(user => ({ ...user, userType: "STAFF" as const }));
    const customers = (customerData?.results || []).map(user => ({ ...user, userType: "CUSTOMER" as const }));
    return [...staff, ...customers];
  }, [staffData, customerData]);

  // Filter by role
  const filteredUsers = useMemo(() => {
    if (roleFilter === "all") return allUsers;
    return allUsers.filter(user => user.userType === roleFilter);
  }, [allUsers, roleFilter]);

  const handleEdit = useCallback((user: CombinedUser) => {
    router.push(`/admin/users/${user.id}?type=${user.userType.toLowerCase()}`);
  }, [router]);

  const handleToggleActive = useCallback((user: CombinedUser) => {
    setUserToToggle(user);
    setIsToggleDialogOpen(true);
  }, []);

  const handleToggleConfirm = useCallback(() => {
    if (!userToToggle) return;
    
    const profileType = userToToggle.userType === "STAFF" ? "staff" : "customers";
    const activate = !userToToggle.user_data.is_active;
    
    toggleUserMutation.mutate({
      profileType,
      profileId: userToToggle.id,
      activate,
    });
  }, [userToToggle, toggleUserMutation]);

  const columns = useMemo<ColumnDef<CombinedUser>[]>(
    () => [
      {
        accessorKey: "user_data.email",
        id: "email",
        header: ({ column }) => {
          return (
            <Button
              variant="ghost"
              onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
              className="h-8 px-2"
            >
              Email
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
          <div className="font-medium">{row.original.user_data.email}</div>
        ),
      },
      {
        accessorKey: "full_name",
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
          <div>{row.getValue("full_name") || "-"}</div>
        ),
      },
      {
        accessorKey: "contact_phone",
        header: "Phone",
        cell: ({ row }) => (
          <div>{row.getValue("contact_phone") || "-"}</div>
        ),
      },
      {
        accessorKey: "userType",
        header: ({ column }) => {
          return (
            <Button
              variant="ghost"
              onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
              className="h-8 px-2"
            >
              Role
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
          const role = row.getValue("userType") as string;
          return (
            <span
              className={`rounded px-2 py-1 text-xs font-semibold ${
                role === "STAFF"
                  ? "bg-purple-600/20 text-purple-400"
                  : "bg-blue-600/20 text-blue-400"
              }`}
            >
              {role === "STAFF" ? "Admin Staff" : "Customer"}
            </span>
          );
        },
      },
      {
        accessorKey: "user_data.is_active",
        id: "status",
        header: "Status",
        cell: ({ row }) => {
          const isActive = row.original.user_data.is_active;
          return (
            <span
              className={`rounded px-2 py-1 text-xs font-semibold ${
                isActive
                  ? "bg-green-600/20 text-green-400"
                  : "bg-red-600/20 text-red-400"
              }`}
            >
              {isActive ? "Active" : "Inactive"}
            </span>
          );
        },
      },
      {
        accessorKey: "user_data.email_verified",
        id: "verified",
        header: "Verified",
        cell: ({ row }) => {
          const verified = row.original.user_data.email_verified;
          return (
            <span
              className={`rounded px-2 py-1 text-xs font-semibold ${
                verified
                  ? "bg-green-600/20 text-green-400"
                  : "bg-gray-600/20 text-gray-400"
              }`}
            >
              {verified ? "Yes" : "No"}
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
          return new Date(date).toLocaleDateString();
        },
      },
      {
        id: "actions",
        header: "Actions",
        cell: ({ row }) => {
          const user = row.original;
          const isActive = user.user_data.is_active;
          return (
            <div className="flex justify-end gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => handleEdit(user)}
                title="Edit user"
              >
                <Pencil className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => handleToggleActive(user)}
                title={isActive ? "Deactivate user" : "Activate user"}
              >
                {isActive ? (
                  <Ban className="h-4 w-4 text-red-400" />
                ) : (
                  <CheckCircle className="h-4 w-4 text-green-400" />
                )}
              </Button>
            </div>
          );
        },
      },
    ],
    [handleEdit, handleToggleActive]
  );

  const table = useReactTable({
    data: filteredUsers,
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
        pageSize: 20,
      },
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
                    <h1 className="text-3xl font-bold">User Management</h1>
                    <p className="mt-2 text-gray-400">
                      Manage and monitor all system users
                    </p>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button>
                        <Plus className="mr-2 h-4 w-4" />
                        Add User
                        <ChevronDown className="ml-2 h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => router.push("/admin/users/new?type=staff")}>
                        Add Staff User
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => router.push("/admin/users/new?type=customer")}>
                        Add Customer
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>

                  {/* Toggle Active/Inactive Dialog */}
                  <Dialog open={isToggleDialogOpen} onOpenChange={setIsToggleDialogOpen}>
                    <DialogContent className="bg-gray-900 text-gray-100">
                      <DialogHeader>
                        <DialogTitle className="text-gray-100">
                          {userToToggle?.user_data.is_active ? "Deactivate" : "Activate"} User
                        </DialogTitle>
                        <DialogDescription className="text-gray-400">
                          Are you sure you want to {userToToggle?.user_data.is_active ? "deactivate" : "activate"}{" "}
                          <span className="font-semibold text-gray-200">
                            {userToToggle?.user_data.email}
                          </span>
                          ?
                        </DialogDescription>
                      </DialogHeader>
                      <DialogFooter>
                        <Button
                          variant="outline"
                          onClick={() => {
                            setIsToggleDialogOpen(false);
                            setUserToToggle(null);
                          }}
                          className="bg-gray-800 text-gray-200 border-gray-700 hover:bg-gray-700"
                        >
                          Cancel
                        </Button>
                        <Button
                          onClick={handleToggleConfirm}
                          className={
                            userToToggle?.user_data.is_active
                              ? "bg-red-600 text-white hover:bg-red-700"
                              : "bg-green-600 text-white hover:bg-green-700"
                          }
                        >
                          {userToToggle?.user_data.is_active ? "Deactivate" : "Activate"}
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>

                <div className="mb-4 flex items-center gap-4">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                    <Input
                      type="text"
                      placeholder="Search users..."
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  <Select value={roleFilter} onValueChange={(value: any) => setRoleFilter(value)}>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Filter by role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Roles</SelectItem>
                      <SelectItem value="STAFF">Admin Staff</SelectItem>
                      <SelectItem value="CUSTOMER">Customers</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {isLoading ? (
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
                                No users found
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
                          filteredUsers.length
                        )}{" "}
                        of {filteredUsers.length} users
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

