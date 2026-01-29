"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Loader2, Save, Package, Hash, Upload, X, DollarSign, ArrowUpDown } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { BackButton } from "@/components/admin/back-button";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { AppSidebar } from "@/components/app-sidebar";
import { AdminHeader } from "@/components/admin-header";
import {
    SidebarInset,
    SidebarProvider,
} from "@/components/ui/sidebar";
import { toast } from "sonner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useCreateProductItem } from "@/lib/product-items";
import { useProducts } from "@/lib/products";

export default function ProductItemAddPage() {
    const router = useRouter();
    const [saving, setSaving] = useState(false);
    const [iconFile, setIconFile] = useState<File | null>(null);
    const [formData, setFormData] = useState<{
        product: string;
        name: string;
        sku_code: string;
        group: string;
        base_price: number;
        normal_price: number;
        discounted_price: number | null;
        sell_price: number;
        is_active: boolean;
        sort_order: number;
    }>({
        product: "",
        name: "",
        sku_code: "",
        group: "",
        base_price: 0,
        normal_price: 0,
        discounted_price: null,
        sell_price: 0,
        is_active: true,
        sort_order: 0,
    });
    const [iconPreview, setIconPreview] = useState<string | null>(null);

    const { data: products = [] } = useProducts();

    const createItemMutation = useCreateProductItem({
        onSuccess: () => {
            toast.success("Product item created successfully");
            setTimeout(() => {
                router.push("/admin/product-items");
            }, 100);
        },
        onError: (error) => {
            toast.error(error instanceof Error ? error.message : "Failed to create product item");
            setSaving(false);
        },
    });

    const handleIconChange = (file: File) => {
        setIconFile(file);
        const reader = new FileReader();
        reader.onloadend = () => {
            setIconPreview(reader.result as string);
        };
        reader.readAsDataURL(file);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.product || !formData.name || !formData.sku_code) {
            toast.error("Product, name, and SKU code are required");
            return;
        }

        setSaving(true);
        const submitData: any = {
            ...formData,
        };

        if (iconFile) submitData.icon_image = iconFile;

        createItemMutation.mutate(submitData, {
            onSettled: () => {
                setSaving(false);
            },
        });
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
                                {/* Header */}
                                <div className="mb-6">
                                    <BackButton href="/admin/product-items" label="Back to Product Items" />
                                    <div>
                                        <h1 className="text-3xl font-bold">Add Product Item</h1>
                                        <p className="mt-2 text-gray-400">
                                            Create a new product item with pricing details
                                        </p>
                                    </div>
                                </div>

                                {/* Main Content */}
                                <div className="max-w-3xl">
                                    <Card className="bg-gray-900 border-gray-800">
                                        <CardHeader>
                                            <CardTitle className="flex items-center gap-2">
                                                <Package className="h-5 w-5" />
                                                Product Item Information
                                            </CardTitle>
                                            <CardDescription>
                                                Fill in the details to create a new product item
                                            </CardDescription>
                                        </CardHeader>
                                        <CardContent>
                                            <form onSubmit={handleSubmit} className="space-y-6">
                                                {/* Product */}
                                                <div className="space-y-2">
                                                    <Label htmlFor="product" className="flex items-center gap-2">
                                                        <Package className="h-4 w-4" />
                                                        Product <span className="text-red-400">*</span>
                                                    </Label>
                                                    <Select
                                                        value={formData.product || undefined}
                                                        onValueChange={(value) => {
                                                            if (!value?.trim()) return;
                                                            setFormData({ ...formData, product: value });
                                                        }}
                                                        required
                                                    >
                                                        <SelectTrigger className="bg-gray-800 text-gray-100 border-gray-700">
                                                            <SelectValue placeholder="Select product" />
                                                        </SelectTrigger>
                                                        <SelectContent className="bg-gray-800 text-gray-100 border-gray-700">
                                                            {products.map((product) => (
                                                                <SelectItem key={product.id} value={String(product.id)} className="hover:bg-gray-700">
                                                                    {product.name}
                                                                </SelectItem>
                                                            ))}
                                                        </SelectContent>
                                                    </Select>
                                                </div>

                                                {/* Name */}
                                                <div className="space-y-2">
                                                    <Label htmlFor="name" className="flex items-center gap-2">
                                                        <Package className="h-4 w-4" />
                                                        Item Name <span className="text-red-400">*</span>
                                                    </Label>
                                                    <Input
                                                        id="name"
                                                        type="text"
                                                        value={formData.name}
                                                        onChange={(e) =>
                                                            setFormData({ ...formData, name: e.target.value })
                                                        }
                                                        placeholder="e.g., 86 Diamonds"
                                                        required
                                                        className="bg-gray-800 text-gray-100 border-gray-700"
                                                    />
                                                </div>

                                                {/* SKU Code */}
                                                <div className="space-y-2">
                                                    <Label htmlFor="sku_code" className="flex items-center gap-2">
                                                        <Hash className="h-4 w-4" />
                                                        SKU Code <span className="text-red-400">*</span>
                                                    </Label>
                                                    <Input
                                                        id="sku_code"
                                                        type="text"
                                                        value={formData.sku_code}
                                                        onChange={(e) =>
                                                            setFormData({ ...formData, sku_code: e.target.value })
                                                        }
                                                        placeholder="Digiflazz buyer_sku_code"
                                                        required
                                                        className="bg-gray-800 text-gray-100 border-gray-700"
                                                    />
                                                </div>

                                                {/* Group */}
                                                <div className="space-y-2">
                                                    <Label htmlFor="group" className="flex items-center gap-2">
                                                        <Package className="h-4 w-4" />
                                                        Group
                                                    </Label>
                                                    <Input
                                                        id="group"
                                                        type="text"
                                                        value={formData.group}
                                                        onChange={(e) =>
                                                            setFormData({ ...formData, group: e.target.value })
                                                        }
                                                        placeholder="e.g., Diamond, Weekly Pass"
                                                        className="bg-gray-800 text-gray-100 border-gray-700"
                                                    />
                                                </div>

                                                {/* Icon Image */}
                                                <div className="space-y-2">
                                                    <Label htmlFor="icon_image" className="flex items-center gap-2">
                                                        <Upload className="h-4 w-4" />
                                                        Icon Image
                                                    </Label>
                                                    <div className="space-y-2">
                                                        {iconPreview ? (
                                                            <div className="relative">
                                                                <div className="relative h-32 w-32 overflow-hidden rounded-md border">
                                                                    <Image
                                                                        src={iconPreview}
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
                                                                        setIconPreview(null);
                                                                        setIconFile(null);
                                                                    }}
                                                                >
                                                                    <X className="h-4 w-4" />
                                                                </Button>
                                                            </div>
                                                        ) : (
                                                            <div>
                                                                <Input
                                                                    id="icon-file"
                                                                    type="file"
                                                                    accept="image/*"
                                                                    onChange={(e) => {
                                                                        const file = e.target.files?.[0];
                                                                        if (file) {
                                                                            handleIconChange(file);
                                                                        }
                                                                    }}
                                                                    className="file:bg-primary hover:file:bg-primary/90 cursor-pointer border-gray-700 bg-gray-800 text-gray-100 file:mr-4 file:rounded-md file:border-0 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white"
                                                                />
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>

                                                <Separator className="bg-gray-700" />

                                                {/* Pricing Section */}
                                                <div className="space-y-4">
                                                    <h3 className="text-lg font-semibold flex items-center gap-2">
                                                        <DollarSign className="h-5 w-5" />
                                                        Pricing
                                                    </h3>

                                                    <div className="grid grid-cols-2 gap-4">
                                                        {/* Base Price */}
                                                        <div className="space-y-2">
                                                            <Label htmlFor="base_price">
                                                                Base Price (Cost)
                                                            </Label>
                                                            <Input
                                                                id="base_price"
                                                                type="number"
                                                                min="0"
                                                                value={formData.base_price}
                                                                onChange={(e) =>
                                                                    setFormData({
                                                                        ...formData,
                                                                        base_price: parseInt(e.target.value) || 0,
                                                                    })
                                                                }
                                                                className="bg-gray-800 text-gray-100 border-gray-700"
                                                            />
                                                        </div>

                                                        {/* Normal Price */}
                                                        <div className="space-y-2">
                                                            <Label htmlFor="normal_price">
                                                                Normal Price
                                                            </Label>
                                                            <Input
                                                                id="normal_price"
                                                                type="number"
                                                                min="0"
                                                                value={formData.normal_price}
                                                                onChange={(e) =>
                                                                    setFormData({
                                                                        ...formData,
                                                                        normal_price: parseInt(e.target.value) || 0,
                                                                    })
                                                                }
                                                                className="bg-gray-800 text-gray-100 border-gray-700"
                                                            />
                                                        </div>

                                                        {/* Discounted Price */}
                                                        <div className="space-y-2">
                                                            <Label htmlFor="discounted_price">
                                                                Discounted Price (Optional)
                                                            </Label>
                                                            <Input
                                                                id="discounted_price"
                                                                type="number"
                                                                min="0"
                                                                value={formData.discounted_price || ""}
                                                                onChange={(e) =>
                                                                    setFormData({
                                                                        ...formData,
                                                                        discounted_price: e.target.value ? parseInt(e.target.value) : null,
                                                                    })
                                                                }
                                                                placeholder="Leave empty if no discount"
                                                                className="bg-gray-800 text-gray-100 border-gray-700"
                                                            />
                                                        </div>

                                                        {/* Sell Price */}
                                                        <div className="space-y-2">
                                                            <Label htmlFor="sell_price">
                                                                Sell Price <span className="text-red-400">*</span>
                                                            </Label>
                                                            <Input
                                                                id="sell_price"
                                                                type="number"
                                                                min="0"
                                                                value={formData.sell_price}
                                                                onChange={(e) =>
                                                                    setFormData({
                                                                        ...formData,
                                                                        sell_price: parseInt(e.target.value) || 0,
                                                                    })
                                                                }
                                                                required
                                                                className="bg-gray-800 text-gray-100 border-gray-700"
                                                            />
                                                        </div>
                                                    </div>
                                                </div>

                                                <Separator className="bg-gray-700" />

                                                {/* Sort Order */}
                                                <div className="space-y-2">
                                                    <Label htmlFor="sort_order" className="flex items-center gap-2">
                                                        <ArrowUpDown className="h-4 w-4" />
                                                        Sort Order
                                                    </Label>
                                                    <Input
                                                        id="sort_order"
                                                        type="number"
                                                        value={formData.sort_order}
                                                        onChange={(e) =>
                                                            setFormData({
                                                                ...formData,
                                                                sort_order: parseInt(e.target.value) || 0,
                                                            })
                                                        }
                                                        className="bg-gray-800 text-gray-100 border-gray-700"
                                                    />
                                                </div>

                                                {/* Active Status */}
                                                <div className="flex items-center space-x-2">
                                                    <Checkbox
                                                        id="is_active"
                                                        checked={formData.is_active}
                                                        onCheckedChange={(checked) =>
                                                            setFormData({
                                                                ...formData,
                                                                is_active: !!checked,
                                                            })
                                                        }
                                                    />
                                                    <Label htmlFor="is_active" className="cursor-pointer">
                                                        Active (visible to users)
                                                    </Label>
                                                </div>

                                                <Separator className="bg-gray-700" />

                                                {/* Submit Button */}
                                                <div className="flex justify-end gap-3">
                                                    <Button
                                                        type="button"
                                                        variant="outline"
                                                        onClick={() => router.push("/admin/product-items")}
                                                        disabled={saving}
                                                    >
                                                        Cancel
                                                    </Button>
                                                    <Button type="submit" disabled={saving}>
                                                        {saving ? (
                                                            <>
                                                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                                Creating...
                                                            </>
                                                        ) : (
                                                            <>
                                                                <Save className="mr-2 h-4 w-4" />
                                                                Create Product Item
                                                            </>
                                                        )}
                                                    </Button>
                                                </div>
                                            </form>
                                        </CardContent>
                                    </Card>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </SidebarInset>
        </SidebarProvider>
    );
}
