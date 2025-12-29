"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
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

interface Product {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  image: string | null;
  bannerImage: string | null;
  category: {
    id: string;
    name: string;
  };
  isActive: boolean;
  sortOrder: number;
  createdAt: string;
}

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [sorting, setSorting] = useState<SortingState>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    slug: "",
    description: "",
    categoryId: "",
    image: "",
    bannerImage: "",
    isActive: true,
    sortOrder: 0,
  });
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [bannerPreview, setBannerPreview] = useState<string | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadingBanner, setUploadingBanner] = useState(false);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/admin/products");
      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Failed to fetch products");
      }

      setProducts(data.data || []);
    } catch (err) {
      console.error("Error fetching products:", err);
      toast.error("Failed to load products");
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await fetch("/api/admin/categories");
      const data = await response.json();
      if (data.success) {
        setCategories(data.data || []);
      }
    } catch (err) {
      console.error("Error fetching categories:", err);
    }
  };

  useEffect(() => {
    fetchProducts();
    fetchCategories();
  }, []);

  const handleImageUpload = async (file: File, type: "image" | "banner") => {
    try {
      if (type === "image") {
        setUploadingImage(true);
      } else {
        setUploadingBanner(true);
      }

      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch(`/api/admin/upload?type=products`, {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Failed to upload image");
      }

      if (type === "image") {
        setFormData((prev) => ({ ...prev, image: data.data.url }));
        setImagePreview(data.data.url);
      } else {
        setFormData((prev) => ({ ...prev, bannerImage: data.data.url }));
        setBannerPreview(data.data.url);
      }

      toast.success("Image uploaded successfully");
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to upload image"
      );
    } finally {
      if (type === "image") {
        setUploadingImage(false);
      } else {
        setUploadingBanner(false);
      }
    }
  };

  const handleCreate = () => {
    setEditingProduct(null);
    setFormData({
      name: "",
      slug: "",
      description: "",
      categoryId: categories[0]?.id || "",
      image: "",
      bannerImage: "",
      isActive: true,
      sortOrder: 0,
    });
    setImagePreview(null);
    setBannerPreview(null);
    setIsDialogOpen(true);
  };

  const handleEdit = useCallback((product: Product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      slug: product.slug,
      description: product.description || "",
      categoryId: product.category.id,
      image: product.image || "",
      bannerImage: product.bannerImage || "",
      isActive: product.isActive,
      sortOrder: product.sortOrder,
    });
    setImagePreview(product.image || null);
    setBannerPreview(product.bannerImage || null);
    setIsDialogOpen(true);
  }, []);

  const handleDeleteClick = useCallback((product: Product) => {
    setProductToDelete(product);
    setIsDeleteDialogOpen(true);
  }, []);

  const handleDeleteConfirm = useCallback(async () => {
    if (!productToDelete) return;

    try {
      const response = await fetch(`/api/admin/products/${productToDelete.id}`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Failed to delete product");
      }

      toast.success("Product deleted");
      setIsDeleteDialogOpen(false);
      setProductToDelete(null);
      fetchProducts();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to delete product");
    }
  }, [productToDelete]);

  const columns = useMemo<ColumnDef<Product>[]>(
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
              Nama Produk
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
        accessorKey: "category",
        header: ({ column }) => {
          return (
            <Button
              variant="ghost"
              onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
              className="h-8 px-2"
            >
              Kategori
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
          const category = row.getValue("category") as { name: string };
          return category?.name || "N/A";
        },
        sortingFn: (rowA, rowB) => {
          const catA = (rowA.getValue("category") as { name: string })?.name || "";
          const catB = (rowB.getValue("category") as { name: string })?.name || "";
          return catA.localeCompare(catB);
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
        accessorKey: "createdAt",
        header: ({ column }) => {
          return (
            <Button
              variant="ghost"
              onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
              className="h-8 px-2"
            >
              Dibuat Pada
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
          const product = row.original;
          return (
            <div className="flex justify-end gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => handleEdit(product)}
              >
                <Pencil className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => handleDeleteClick(product)}
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

  // Add image column at the beginning
  const columnsWithImage = useMemo(() => {
    return [
      {
        accessorKey: "image",
        header: "Preview",
        cell: ({ row }: { row: any }) => {
          const image = row.original.image as string | null;
          return image ? (
            <div className="h-16 w-16 overflow-hidden rounded-md">
              <Image
                src={image}
                alt={row.original.name}
                width={64}
                height={64}
                className="h-full w-full object-cover"
              />
            </div>
          ) : (
            <div className="flex h-16 w-16 items-center justify-center rounded-md bg-gray-800 text-gray-500 text-xs">
              No Image
            </div>
          );
        },
        enableSorting: false,
      },
      ...columns,
    ];
  }, [columns]);

  const table = useReactTable({
    data: products,
    columns: columnsWithImage,
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
      const product = row.original;
      const searchLower = filterValue.toLowerCase();
      return (
        product.name.toLowerCase().includes(searchLower) ||
        product.slug.toLowerCase().includes(searchLower) ||
        product.category.name.toLowerCase().includes(searchLower)
      );
    },
  });

  const handleSubmit = async () => {
    try {
      const url = editingProduct
        ? `/api/admin/products/${editingProduct.id}`
        : "/api/admin/products";
      const method = editingProduct ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Failed to save product");
      }

      toast.success(editingProduct ? "Product updated" : "Product created");
      setIsDialogOpen(false);
      setImagePreview(null);
      setBannerPreview(null);
      fetchProducts();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save product");
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
                    <h1 className="text-3xl font-bold">Kelola Produk</h1>
                    <p className="mt-2 text-gray-400">
                      Atur dan pantau produk Anda di sini.
                    </p>
                  </div>
                  <Dialog
                    open={isDialogOpen}
                    onOpenChange={(open) => {
                      setIsDialogOpen(open);
                      if (!open) {
                        setImagePreview(null);
                        setBannerPreview(null);
                      }
                    }}
                  >
                    <DialogTrigger asChild>
                      <Button onClick={handleCreate}>
                        <Plus className="mr-2 h-4 w-4" />
                        Tambah
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl bg-gray-900 text-gray-100">
                      <DialogHeader>
                        <DialogTitle className="text-gray-100">
                          {editingProduct ? "Edit Produk" : "Tambah Produk"}
                        </DialogTitle>
                        <DialogDescription className="text-gray-400">
                          {editingProduct
                            ? "Edit data produk yang telah tersedia."
                            : "Tambahkan produk baru."}
                        </DialogDescription>
                      </DialogHeader>
                      <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                          <Label htmlFor="name" className="text-gray-200">Nama Produk</Label>
                          <Input
                            id="name"
                            value={formData.name}
                            onChange={(e) => {
                              setFormData({
                                ...formData,
                                name: e.target.value,
                                slug: e.target.value
                                  .toLowerCase()
                                  .replace(/[^a-z0-9]+/g, "-")
                                  .replace(/(^-|-$)/g, ""),
                              });
                            }}
                            placeholder="e.g. Mobile Legends"
                            className="bg-gray-800 text-gray-100 border-gray-700 placeholder:text-gray-500"
                          />
                        </div>
                        <div className="grid gap-2">
                          <Label htmlFor="slug" className="text-gray-200">Slug</Label>
                          <Input
                            id="slug"
                            value={formData.slug}
                            onChange={(e) =>
                              setFormData({ ...formData, slug: e.target.value })
                            }
                            placeholder="e.g. mobile-legends"
                            className="bg-gray-800 text-gray-100 border-gray-700 placeholder:text-gray-500"
                          />
                        </div>
                        <div className="grid gap-2">
                          <Label htmlFor="categoryId" className="text-gray-200">Kategori</Label>
                          <Select
                            value={formData.categoryId}
                            onValueChange={(value) =>
                              setFormData({ ...formData, categoryId: value })
                            }
                          >
                            <SelectTrigger className="bg-gray-800 text-gray-100 border-gray-700">
                              <SelectValue placeholder="Pilih kategori" />
                            </SelectTrigger>
                            <SelectContent className="bg-gray-800 text-gray-100 border-gray-700">
                              {categories.map((cat) => (
                                <SelectItem key={cat.id} value={cat.id} className="text-gray-100 hover:bg-gray-700">
                                  {cat.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="grid gap-2">
                          <Label htmlFor="description" className="text-gray-200">Deskripsi</Label>
                          <Input
                            id="description"
                            value={formData.description}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                description: e.target.value,
                              })
                            }
                            placeholder="Optional description"
                            className="bg-gray-800 text-gray-100 border-gray-700 placeholder:text-gray-500"
                          />
                        </div>
                        <div className="grid gap-2">
                          <Label htmlFor="image" className="text-gray-200">Image (for homepage)</Label>
                          <div className="space-y-2">
                            {imagePreview ? (
                              <div className="relative">
                                <div className="relative h-32 w-full overflow-hidden rounded-md border">
                                  <Image
                                    src={imagePreview}
                                    alt="Preview"
                                    fill
                                    className="object-cover"
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
                                      handleImageUpload(file, "image");
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
                          <Label htmlFor="bannerImage" className="text-gray-200">Banner Image</Label>
                          <div className="space-y-2">
                            {bannerPreview ? (
                              <div className="relative">
                                <div className="relative h-32 w-full overflow-hidden rounded-md border">
                                  <Image
                                    src={bannerPreview}
                                    alt="Banner Preview"
                                    fill
                                    className="object-cover"
                                  />
                                </div>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  className="absolute right-2 top-2"
                                  onClick={() => {
                                    setBannerPreview(null);
                                    setFormData((prev) => ({ ...prev, bannerImage: "" }));
                                  }}
                                >
                                  <X className="h-4 w-4" />
                                </Button>
                              </div>
                            ) : (
                              <div className="flex items-center gap-2">
                                <Input
                                  id="banner-file"
                                  type="file"
                                  accept="image/*"
                                  onChange={(e) => {
                                    const file = e.target.files?.[0];
                                    if (file) {
                                      handleImageUpload(file, "banner");
                                    }
                                  }}
                                  className="hidden"
                                />
                                <Label
                                  htmlFor="banner-file"
                                  className="flex cursor-pointer items-center gap-2 rounded-md border border-dashed p-4 hover:bg-gray-800"
                                >
                                  <Upload className="h-4 w-4" />
                                  <span className="text-sm">
                                    {uploadingBanner ? "Uploading..." : "Upload Banner"}
                                  </span>
                                </Label>
                                <Input
                                  id="banner-url"
                                  value={formData.bannerImage}
                                  onChange={(e) => {
                                    setFormData({ ...formData, bannerImage: e.target.value });
                                    setBannerPreview(e.target.value || null);
                                  }}
                                  placeholder="Or enter banner URL"
                                  className="flex-1 bg-gray-800 text-gray-100 border-gray-700 placeholder:text-gray-500"
                                />
                              </div>
                            )}
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
                          className="bg-gray-800 text-gray-200 border-gray-700 hover:bg-gray-700"
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
                          Hapus Produk
                        </DialogTitle>
                        <DialogDescription className="text-gray-400">
                          Apakah Anda yakin ingin menghapus produk{" "}
                          <span className="font-semibold text-gray-200">
                            {productToDelete?.name}
                          </span>
                          ? Tindakan ini tidak dapat dibatalkan.
                        </DialogDescription>
                      </DialogHeader>
                      <DialogFooter>
                        <Button
                          variant="outline"
                          onClick={() => {
                            setIsDeleteDialogOpen(false);
                            setProductToDelete(null);
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
                                No products found
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
                        of {table.getFilteredRowModel().rows.length} products
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

