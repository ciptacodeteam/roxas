"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
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

interface User {
  id: string;
  email: string;
  name: string | null;
  image: string | null;
  emailVerified: boolean;
  phone: string | null;
  role: string;
  createdAt: string;
  updatedAt: string;
  _count: {
    orders: number;
  };
}

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [sorting, setSorting] = useState<SortingState>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [formData, setFormData] = useState({
    email: "",
    name: "",
    password: "",
    phone: "",
    role: "USER",
    emailVerified: false,
  });

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/admin/users");
      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Failed to fetch users");
      }

      setUsers(data.data || []);
    } catch (err) {
      console.error("Error fetching users:", err);
      toast.error("Failed to load users");
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleEdit = useCallback((user: User) => {
    setEditingUser(user);
    setFormData({
      email: user.email,
      name: user.name || "",
      password: "", // Don't pre-fill password
      phone: user.phone || "",
      role: user.role,
      emailVerified: user.emailVerified,
    });
    setIsDialogOpen(true);
  }, []);

  const handleDeleteClick = useCallback((user: User) => {
    setUserToDelete(user);
    setIsDeleteDialogOpen(true);
  }, []);

  const handleDeleteConfirm = useCallback(async () => {
    if (!userToDelete) return;

    try {
      const response = await fetch(`/api/admin/users/${userToDelete.id}`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Failed to delete user");
      }

      toast.success("User deleted");
      setIsDeleteDialogOpen(false);
      setUserToDelete(null);
      fetchUsers();
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to delete user"
      );
    }
  }, [userToDelete]);

  const columns = useMemo<ColumnDef<User>[]>(
    () => [
      {
        accessorKey: "email",
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
          <div className="font-medium">{row.getValue("email")}</div>
        ),
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
          <div>{row.getValue("name") || "-"}</div>
        ),
      },
      {
        accessorKey: "phone",
        header: "Phone",
        cell: ({ row }) => (
          <div>{row.getValue("phone") || "-"}</div>
        ),
      },
      {
        accessorKey: "role",
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
          const role = row.getValue("role") as string;
          return (
            <span
              className={`rounded px-2 py-1 text-xs font-semibold ${
                role === "ADMIN"
                  ? "bg-purple-600/20 text-purple-400"
                  : "bg-blue-600/20 text-blue-400"
              }`}
            >
              {role}
            </span>
          );
        },
      },
      {
        accessorKey: "emailVerified",
        header: "Verified",
        cell: ({ row }) => {
          const verified = row.getValue("emailVerified") as boolean;
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
        accessorKey: "_count.orders",
        header: "Orders",
        cell: ({ row }) => {
          const count = row.original._count.orders;
          return <div>{count}</div>;
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
          return date.toLocaleDateString("id-ID");
        },
      },
      {
        id: "actions",
        header: "Aksi",
        cell: ({ row }) => {
          const user = row.original;
          return (
            <div className="flex justify-end gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => handleEdit(user)}
              >
                <Pencil className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => handleDeleteClick(user)}
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
    data: users,
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
      const user = row.original;
      const searchLower = filterValue.toLowerCase();
      return (
        user.email.toLowerCase().includes(searchLower) ||
        (user.name?.toLowerCase().includes(searchLower) || false) ||
        (user.phone?.toLowerCase().includes(searchLower) || false)
      );
    },
  });

  const handleCreate = () => {
    setEditingUser(null);
    setFormData({
      email: "",
      name: "",
      password: "",
      phone: "",
      role: "USER",
      emailVerified: false,
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = async () => {
    try {
      if (!formData.email) {
        toast.error("Email is required");
        return;
      }

      // Password is required when creating new user
      if (!editingUser && !formData.password) {
        toast.error("Password is required for new users");
        return;
      }

      const url = editingUser
        ? `/api/admin/users/${editingUser.id}`
        : "/api/admin/users";
      const method = editingUser ? "PUT" : "POST";

      // Don't send password if it's empty (when editing)
      const submitData = editingUser && !formData.password
        ? (({ password, ...rest }) => rest)(formData)
        : { ...formData };

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(submitData),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Failed to save user");
      }

      toast.success(
        editingUser ? "User updated" : "User created"
      );
      setIsDialogOpen(false);
      fetchUsers();
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to save user"
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
                    <h1 className="text-3xl font-bold">Kelola Users</h1>
                    <p className="mt-2 text-gray-400">
                      Atur dan pantau pengguna Anda di sini.
                    </p>
                  </div>
                  <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                    <DialogTrigger asChild>
                      <Button onClick={handleCreate}>
                        <Plus className="mr-2 h-4 w-4" />
                        Tambah
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="bg-gray-900 text-gray-100 max-w-2xl">
                      <DialogHeader>
                        <DialogTitle className="text-gray-100">
                          {editingUser ? "Edit User" : "Tambah User"}
                        </DialogTitle>
                        <DialogDescription className="text-gray-400">
                          {editingUser
                            ? "Edit data user yang telah tersedia."
                            : "Tambahkan user baru."}
                        </DialogDescription>
                      </DialogHeader>
                      <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                          <Label htmlFor="email" className="text-gray-200">
                            Email <span className="text-red-400">*</span>
                          </Label>
                          <Input
                            id="email"
                            type="email"
                            value={formData.email}
                            onChange={(e) =>
                              setFormData({ ...formData, email: e.target.value })
                            }
                            placeholder="user@example.com"
                            className="bg-gray-800 text-gray-100 border-gray-700 placeholder:text-gray-500"
                            required
                          />
                        </div>
                        <div className="grid gap-2">
                          <Label htmlFor="name" className="text-gray-200">Name</Label>
                          <Input
                            id="name"
                            value={formData.name}
                            onChange={(e) =>
                              setFormData({ ...formData, name: e.target.value })
                            }
                            placeholder="User name"
                            className="bg-gray-800 text-gray-100 border-gray-700 placeholder:text-gray-500"
                          />
                        </div>
                        <div className="grid gap-2">
                          <Label htmlFor="password" className="text-gray-200">
                            Password {!editingUser && <span className="text-red-400">*</span>}
                            {editingUser && <span className="text-gray-500 text-xs">(leave empty to keep current)</span>}
                          </Label>
                          <Input
                            id="password"
                            type="password"
                            value={formData.password}
                            onChange={(e) =>
                              setFormData({ ...formData, password: e.target.value })
                            }
                            placeholder={editingUser ? "New password (optional)" : "Password"}
                            className="bg-gray-800 text-gray-100 border-gray-700 placeholder:text-gray-500"
                            required={!editingUser}
                          />
                        </div>
                        <div className="grid gap-2">
                          <Label htmlFor="phone" className="text-gray-200">Phone</Label>
                          <Input
                            id="phone"
                            value={formData.phone}
                            onChange={(e) =>
                              setFormData({ ...formData, phone: e.target.value })
                            }
                            placeholder="+62..."
                            className="bg-gray-800 text-gray-100 border-gray-700 placeholder:text-gray-500"
                          />
                        </div>
                        <div className="grid gap-2">
                          <Label htmlFor="role" className="text-gray-200">Role</Label>
                          <Select
                            value={formData.role}
                            onValueChange={(value) =>
                              setFormData({ ...formData, role: value })
                            }
                          >
                            <SelectTrigger className="bg-gray-800 text-gray-100 border-gray-700">
                              <SelectValue placeholder="Select role" />
                            </SelectTrigger>
                            <SelectContent className="bg-gray-800 text-gray-100 border-gray-700">
                              <SelectItem value="USER" className="text-gray-100 hover:bg-gray-700">
                                USER
                              </SelectItem>
                              <SelectItem value="ADMIN" className="text-gray-100 hover:bg-gray-700">
                                ADMIN
                              </SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="flex items-center gap-2">
                          <Checkbox
                            id="emailVerified"
                            checked={formData.emailVerified}
                            onCheckedChange={(checked) =>
                              setFormData({ ...formData, emailVerified: !!checked })
                            }
                          />
                          <Label htmlFor="emailVerified" className="text-gray-200">Email Verified</Label>
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

                  {/* Delete Confirmation Dialog */}
                  <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                    <DialogContent className="bg-gray-900 text-gray-100">
                      <DialogHeader>
                        <DialogTitle className="text-gray-100">
                          Hapus User
                        </DialogTitle>
                        <DialogDescription className="text-gray-400">
                          Apakah Anda yakin ingin menghapus user{" "}
                          <span className="font-semibold text-gray-200">
                            {userToDelete?.email}
                          </span>
                          ? Tindakan ini tidak dapat dibatalkan.
                        </DialogDescription>
                      </DialogHeader>
                      <DialogFooter>
                        <Button
                          variant="outline"
                          onClick={() => {
                            setIsDeleteDialogOpen(false);
                            setUserToDelete(null);
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
                          table.getFilteredRowModel().rows.length
                        )}{" "}
                        of {table.getFilteredRowModel().rows.length} users
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

