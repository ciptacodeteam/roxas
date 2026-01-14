"use client";

import { useState, useMemo, useCallback } from "react";
import { Loader2, Search, Plus, Pencil, Trash2, ArrowUpDown, ArrowUp, ArrowDown, Upload, X } from "lucide-react";
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
import { toast } from "sonner";
import { useAdminMarketingBanners, useCreateMarketingBanner, useUpdateMarketingBanner, useDeleteMarketingBanner } from "@/lib/queries";
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
import { Textarea } from "@/components/ui/textarea";

interface MarketingBanner {
  id: string;
  title: string | null;
  image: string;
  link: string | null;
  description: string | null;
  isActive: boolean;
  sortOrder: number;
  startDate: string | null;
  endDate: string | null;
  createdAt: string;
  updatedAt: string;
}

export default function MarketingBannersPage() {
  const [search, setSearch] = useState("");
  const [sorting, setSorting] = useState<SortingState>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [bannerToDelete, setBannerToDelete] = useState<MarketingBanner | null>(null);
  const [editingBanner, setEditingBanner] = useState<MarketingBanner | null>(null);
  const [formData, setFormData] = useState({
    title: "",
    image: "",
    link: "",
    description: "",
    isActive: true,
    sortOrder: 0,
    startDate: "",
    endDate: "",
  });
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);

  // Use TanStack Query hooks
  const { data: banners = [], isLoading: loading } = useAdminMarketingBanners();

  const createBannerMutation = useCreateMarketingBanner({
    onSuccess: () => {
      toast.success("Banner created successfully");
      setIsDialogOpen(false);
      resetForm();
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Failed to create banner");
    },
  });

  const updateBannerMutation = useUpdateMarketingBanner({
    onSuccess: () => {
      toast.success("Banner updated successfully");
      setIsDialogOpen(false);
      resetForm();
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Failed to update banner");
    },
  });

  const deleteBannerMutation = useDeleteMarketingBanner({
    onSuccess: () => {
      toast.success("Banner deleted successfully");
      setIsDeleteDialogOpen(false);
      setBannerToDelete(null);
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Failed to delete banner");
    },
  });

  const resetForm = useCallback(() => {
    setEditingBanner(null);
    setFormData({
      title: "",
      image: "",
      link: "",
      description: "",
      isActive: true,
      sortOrder: 0,
      startDate: "",
      endDate: "",
    });
    setImagePreview(null);
  }, []);

  const handleImageUpload = async (file: File) => {
    try {
      setUploadingImage(true);

      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch(`/api/admin/upload?type=banners`, {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Failed to upload image");
      }

      setFormData((prev) => ({ ...prev, image: data.data.url }));
      setImagePreview(data.data.url);

      toast.success("Image uploaded successfully");
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to upload image"
      );
    } finally {
      setUploadingImage(false);
    }
  };

  const handleEdit = useCallback((banner: MarketingBanner) => {
    setEditingBanner(banner);
    setFormData({
      title: banner.title || "",
      image: banner.image,
      link: banner.link || "",
      description: banner.description || "",
      isActive: banner.isActive,
      sortOrder: banner.sortOrder,
      startDate: banner.startDate ? new Date(banner.startDate).toISOString().slice(0, 16) : "",
      endDate: banner.endDate ? new Date(banner.endDate).toISOString().slice(0, 16) : "",
    });
    setImagePreview(banner.image);
    setIsDialogOpen(true);
  }, []);

  const handleDeleteClick = useCallback((banner: MarketingBanner) => {
    setBannerToDelete(banner);
    setIsDeleteDialogOpen(true);
  }, []);

  const handleDeleteConfirm = useCallback(() => {
    if (!bannerToDelete) return;
    deleteBannerMutation.mutate(bannerToDelete.id);
  }, [bannerToDelete, deleteBannerMutation]);

  const columns = useMemo<ColumnDef<MarketingBanner>[]>(
    () => [
      {
        accessorKey: "image",
        header: "Image",
        cell: ({ row }) => {
          const image = row.getValue("image") as string;
          return (
            <div className="relative h-16 w-24 overflow-hidden rounded">
              <Image
                src={image}
                alt={row.original.title || "Banner"}
                fill
                className="object-cover"
              />
            </div>
          );
        },
      },
      {
        accessorKey: "title",
        header: ({ column }) => {
          return (
            <Button
              variant="ghost"
              onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
              className="h-8 px-2"
            >
              Title
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
          <div className="font-medium">{row.getValue("title") || "-"}</div>
        ),
      },
      {
        accessorKey: "link",
        header: "Link",
        cell: ({ row }) => {
          const link = row.getValue("link") as string | null;
          return link ? (
            <a
              href={link}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-400 hover:underline"
            >
              {link.length > 30 ? `${link.substring(0, 30)}...` : link}
            </a>
          ) : (
            <span className="text-gray-400">-</span>
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
        header: ({ column }) => {
          return (
            <Button
              variant="ghost"
              onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
              className="h-8 px-2"
            >
              Sort Order
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
      },
      {
        accessorKey: "startDate",
        header: "Start Date",
        cell: ({ row }) => {
          const date = row.getValue("startDate") as string | null;
          return date ? new Date(date).toLocaleDateString() : "-";
        },
      },
      {
        accessorKey: "endDate",
        header: "End Date",
        cell: ({ row }) => {
          const date = row.getValue("endDate") as string | null;
          return date ? new Date(date).toLocaleDateString() : "-";
        },
      },
      {
        id: "actions",
        header: "Aksi",
        cell: ({ row }) => {
          const banner = row.original;
          return (
            <div className="flex justify-end gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => handleEdit(banner)}
              >
                <Pencil className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => handleDeleteClick(banner)}
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
    data: banners,
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
      const banner = row.original;
      const searchLower = filterValue.toLowerCase();
      return (
        (banner.title?.toLowerCase().includes(searchLower) || false) ||
        (banner.description?.toLowerCase().includes(searchLower) || false) ||
        (banner.link?.toLowerCase().includes(searchLower) || false)
      );
    },
  });

  const handleCreate = () => {
    resetForm();
    setIsDialogOpen(true);
  };

  const handleDialogClose = (open: boolean) => {
    setIsDialogOpen(open);
    if (!open) {
      setImagePreview(null);
    }
  };

  const handleSubmit = () => {
    if (!formData.image) {
      toast.error("Image is required");
      return;
    }

    const submitData = {
      ...formData,
      startDate: formData.startDate || null,
      endDate: formData.endDate || null,
    };

    if (editingBanner) {
      updateBannerMutation.mutate({ id: editingBanner.id, data: submitData });
    } else {
      createBannerMutation.mutate(submitData);
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
                    <h1 className="text-3xl font-bold">Kelola Marketing Banner</h1>
                    <p className="mt-2 text-gray-400">
                      Atur dan pantau banner marketing Anda di sini.
                    </p>
                  </div>
                  <Dialog open={isDialogOpen} onOpenChange={handleDialogClose}>
                    <DialogTrigger asChild>
                      <Button onClick={handleCreate}>
                        <Plus className="mr-2 h-4 w-4" />
                        Tambah
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="bg-gray-900 text-gray-100 max-w-2xl max-h-[90vh] overflow-y-auto">
                      <DialogHeader>
                        <DialogTitle className="text-gray-100">
                          {editingBanner ? "Edit Marketing Banner" : "Tambah Marketing Banner"}
                        </DialogTitle>
                        <DialogDescription className="text-gray-400">
                          {editingBanner
                            ? "Edit data marketing banner yang telah tersedia."
                            : "Tambahkan marketing banner baru."}
                        </DialogDescription>
                      </DialogHeader>
                      <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                          <Label htmlFor="title" className="text-gray-200">Title (Optional)</Label>
                          <Input
                            id="title"
                            value={formData.title}
                            onChange={(e) =>
                              setFormData({ ...formData, title: e.target.value })
                            }
                            placeholder="Banner title"
                            className="bg-gray-800 text-gray-100 border-gray-700 placeholder:text-gray-500"
                          />
                        </div>
                        <div className="grid gap-2">
                          <Label htmlFor="image" className="text-gray-200">
                            Image <span className="text-red-400">*</span>
                          </Label>
                          <div className="space-y-2">
                            {imagePreview ? (
                              <div className="relative">
                                <div className="relative h-48 w-full overflow-hidden rounded-md border border-gray-700">
                                  <Image
                                    src={imagePreview}
                                    alt="Preview"
                                    fill
                                    className="object-contain"
                                    onError={() => setImagePreview(null)}
                                  />
                                </div>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  className="absolute right-2 top-2"
                                  onClick={() => {
                                    setImagePreview(null);
                                    setFormData((prev) => ({ ...prev, image: "" }));
                                  }}
                                >
                                  <X className="h-4 w-4" />
                                </Button>
                              </div>
                            ) : (
                              <div className="flex items-center gap-2">
                                <Input
                                  id="image-file"
                                  type="file"
                                  accept="image/*"
                                  onChange={(e) => {
                                    const file = e.target.files?.[0];
                                    if (file) {
                                      handleImageUpload(file);
                                    }
                                  }}
                                  className="hidden"
                                />
                                <Label
                                  htmlFor="image-file"
                                  className="flex cursor-pointer items-center gap-2 rounded-md border border-dashed p-4 hover:bg-gray-800"
                                >
                                  <Upload className="h-4 w-4" />
                                  <span className="text-sm">
                                    {uploadingImage ? "Uploading..." : "Upload Image"}
                                  </span>
                                </Label>
                                <Input
                                  id="image-url"
                                  value={formData.image}
                                  onChange={(e) => {
                                    setFormData({ ...formData, image: e.target.value });
                                    setImagePreview(e.target.value || null);
                                  }}
                                  placeholder="Or enter image URL"
                                  className="flex-1 bg-gray-800 text-gray-100 border-gray-700 placeholder:text-gray-500"
                                />
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="grid gap-2">
                          <Label htmlFor="link" className="text-gray-200">Link (Optional)</Label>
                          <Input
                            id="link"
                            value={formData.link}
                            onChange={(e) =>
                              setFormData({ ...formData, link: e.target.value })
                            }
                            placeholder="https://example.com"
                            className="bg-gray-800 text-gray-100 border-gray-700 placeholder:text-gray-500"
                          />
                        </div>
                        <div className="grid gap-2">
                          <Label htmlFor="description" className="text-gray-200">Description (Optional)</Label>
                          <Textarea
                            id="description"
                            value={formData.description}
                            onChange={(e) =>
                              setFormData({ ...formData, description: e.target.value })
                            }
                            placeholder="Banner description"
                            className="bg-gray-800 text-gray-100 border-gray-700 placeholder:text-gray-500"
                            rows={3}
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="grid gap-2">
                            <Label htmlFor="startDate" className="text-gray-200">Start Date (Optional)</Label>
                            <Input
                              id="startDate"
                              type="datetime-local"
                              value={formData.startDate}
                              onChange={(e) =>
                                setFormData({ ...formData, startDate: e.target.value })
                              }
                              className="bg-gray-800 text-gray-100 border-gray-700"
                            />
                          </div>
                          <div className="grid gap-2">
                            <Label htmlFor="endDate" className="text-gray-200">End Date (Optional)</Label>
                            <Input
                              id="endDate"
                              type="datetime-local"
                              value={formData.endDate}
                              onChange={(e) =>
                                setFormData({ ...formData, endDate: e.target.value })
                              }
                              className="bg-gray-800 text-gray-100 border-gray-700"
                            />
                          </div>
                        </div>
                        <div className="grid gap-2">
                          <Label htmlFor="sortOrder" className="text-gray-200">Sort Order</Label>
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
                          <Label htmlFor="isActive" className="text-gray-200">Active</Label>
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
                          Hapus Marketing Banner
                        </DialogTitle>
                        <DialogDescription className="text-gray-400">
                          Apakah Anda yakin ingin menghapus marketing banner{" "}
                          <span className="font-semibold text-gray-200">
                            {bannerToDelete?.title || "ini"}
                          </span>
                          ? Tindakan ini tidak dapat dibatalkan.
                        </DialogDescription>
                      </DialogHeader>
                      <DialogFooter>
                        <Button
                          variant="outline"
                          onClick={() => {
                            setIsDeleteDialogOpen(false);
                            setBannerToDelete(null);
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
                                No marketing banners found
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
                        of {table.getFilteredRowModel().rows.length} banners
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

