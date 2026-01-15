"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { Loader2, Save, Package, User, CreditCard, Calendar, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { BackButton } from "@/components/admin/back-button";
import { AppSidebar } from "@/components/app-sidebar";
import { AdminHeader } from "@/components/admin-header";
import {
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar";
import { toast } from "sonner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAdminOrder, useUpdateOrder } from "@/lib/queries";
import { formatDateTime } from "@/lib/date-utils";

interface OrderDetail {
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
  } | null;
  digiflazzTx: {
    id: string;
    refId: string;
    trxId: string | null;
    status: string;
    message: string | null;
  } | null;
}

export default function OrderEditPage() {
  const router = useRouter();
  const params = useParams();
  const orderId = params?.id as string;

  const [saving, setSaving] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<string>("");

  const { data: orderData, isLoading: loading, error } = useAdminOrder(orderId);
  const typedOrderData = orderData as OrderDetail | null | undefined;

  useEffect(() => {
    if (typedOrderData) {
      // Ensure status is a string to match SelectItem values exactly
      setSelectedStatus(String(typedOrderData.status || ""));
    }
  }, [typedOrderData]);

  const updateOrderMutation = useUpdateOrder({
    onSuccess: () => {
      toast.success("Order status updated successfully");
      router.push("/admin/orders");
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Failed to update order status");
      setSaving(false);
    },
  });

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedStatus) {
      toast.error("Status is required");
      return;
    }

    setSaving(true);
    updateOrderMutation.mutate(
      { id: orderId, data: { status: selectedStatus } },
      {
        onSettled: () => {
          setSaving(false);
        },
      }
    );
  };

  if (loading) {
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
          <div className="flex flex-1 flex-col items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-rose-500" />
          </div>
        </SidebarInset>
      </SidebarProvider>
    );
  }

  if (error || !typedOrderData) {
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
          <div className="flex flex-1 flex-col items-center justify-center">
            <p className="text-red-400">
              {error instanceof Error ? error.message : "Order not found"}
            </p>
            <Button
              onClick={() => router.push("/admin/orders")}
              className="mt-4"
            >
              Back to Orders
            </Button>
          </div>
        </SidebarInset>
      </SidebarProvider>
    );
  }

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
                  <BackButton href="/admin/orders" label="Back to Orders" />
                  <div>
                    <h1 className="text-3xl font-bold">Edit Order</h1>
                    <p className="mt-2 text-gray-400">
                      View order details and update status
                    </p>
                  </div>
                </div>

                {/* Main Content - Two Column Layout */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Left Column - Status Update Form */}
                  <div className="lg:col-span-2">
                    <Card className="bg-gray-900 border-gray-800">
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Package className="h-5 w-5" />
                          Order Information
                        </CardTitle>
                        <CardDescription>
                          Update order status
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <form onSubmit={handleSubmit} className="space-y-6">
                          {/* Order Number */}
                          <div className="space-y-2">
                            <Label className="flex items-center gap-2">
                              <Package className="h-4 w-4" />
                              Order Number
                            </Label>
                            <div className="text-sm text-gray-200 font-mono bg-gray-800 px-3 py-2 rounded-md">
                              {typedOrderData.orderNumber}
                            </div>
                          </div>

                          {/* Status Update */}
                          <div className="space-y-2">
                            <Label htmlFor="status" className="flex items-center gap-2">
                              <CheckCircle2 className="h-4 w-4" />
                              Status <span className="text-red-400">*</span>
                            </Label>
                            <Select 
                              value={selectedStatus || undefined} 
                              onValueChange={(value) => {
                                if (!value?.trim()) return;
                                setSelectedStatus(value);
                              }}
                            >
                              <SelectTrigger className="bg-gray-800 text-gray-100 border-gray-700">
                                <SelectValue placeholder="Select status" />
                              </SelectTrigger>
                              <SelectContent className="bg-gray-800 text-gray-100 border-gray-700">
                                <SelectItem value="PENDING" className="hover:bg-gray-700">
                                  PENDING
                                </SelectItem>
                                <SelectItem value="PAID" className="hover:bg-gray-700">
                                  PAID
                                </SelectItem>
                                <SelectItem value="PROCESSING" className="hover:bg-gray-700">
                                  PROCESSING
                                </SelectItem>
                                <SelectItem value="COMPLETED" className="hover:bg-gray-700">
                                  COMPLETED
                                </SelectItem>
                                <SelectItem value="FAILED" className="hover:bg-gray-700">
                                  FAILED
                                </SelectItem>
                                <SelectItem value="REFUNDED" className="hover:bg-gray-700">
                                  REFUNDED
                                </SelectItem>
                                <SelectItem value="EXPIRED" className="hover:bg-gray-700">
                                  EXPIRED
                                </SelectItem>
                              </SelectContent>
                            </Select>
                          </div>

                          <Separator className="bg-gray-700" />

                          {/* Submit Button */}
                          <div className="flex justify-end gap-3">
                            <Button
                              type="button"
                              variant="outline"
                              onClick={() => router.push("/admin/orders")}
                              disabled={saving}
                            >
                              Cancel
                            </Button>
                            <Button type="submit" disabled={saving}>
                              {saving ? (
                                <>
                                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                  Saving...
                                </>
                              ) : (
                                <>
                                  <Save className="mr-2 h-4 w-4" />
                                  Update Status
                                </>
                              )}
                            </Button>
                          </div>
                        </form>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Right Column - Order Details */}
                  <div className="space-y-6">
                    {/* Order Status */}
                    <Card className="bg-gray-900 border-gray-800">
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Package className="h-5 w-5" />
                          Status
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-400">Current Status</span>
                          <Badge
                            variant="default"
                            className={getStatusColor(typedOrderData.status)}
                          >
                            {typedOrderData.status}
                          </Badge>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Customer Information */}
                    <Card className="bg-gray-900 border-gray-800">
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <User className="h-5 w-5" />
                          Customer
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div>
                          <span className="text-xs text-gray-400">Email</span>
                          <p className="text-sm text-gray-200">{typedOrderData.user.email}</p>
                        </div>
                        {typedOrderData.user.name && (
                          <div>
                            <span className="text-xs text-gray-400">Name</span>
                            <p className="text-sm text-gray-200">{typedOrderData.user.name}</p>
                          </div>
                        )}
                      </CardContent>
                    </Card>

                    {/* Product Information */}
                    <Card className="bg-gray-900 border-gray-800">
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Package className="h-5 w-5" />
                          Product
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div>
                          <span className="text-xs text-gray-400">Product</span>
                          <p className="text-sm text-gray-200">{typedOrderData.productItem.product.name}</p>
                        </div>
                        <div>
                          <span className="text-xs text-gray-400">Item</span>
                          <p className="text-sm text-gray-200">{typedOrderData.productItem.name}</p>
                        </div>
                        <div>
                          <span className="text-xs text-gray-400">Category</span>
                          <p className="text-sm text-gray-200">{typedOrderData.productItem.product.category.name}</p>
                        </div>
                        <div>
                          <span className="text-xs text-gray-400">Price</span>
                          <p className="text-sm text-gray-200 font-semibold">
                            {formatPrice(typedOrderData.finalPrice)}
                          </p>
                          {typedOrderData.originalPrice !== typedOrderData.finalPrice && (
                            <p className="text-xs text-gray-400 line-through">
                              {formatPrice(typedOrderData.originalPrice)}
                            </p>
                          )}
                        </div>
                      </CardContent>
                    </Card>

                    {/* Payment Information */}
                    {typedOrderData.payment && (
                      <Card className="bg-gray-900 border-gray-800">
                        <CardHeader>
                          <CardTitle className="flex items-center gap-2">
                            <CreditCard className="h-5 w-5" />
                            Payment
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          {typedOrderData.payment.paymentMethod && (
                            <div>
                              <span className="text-xs text-gray-400">Method</span>
                              <p className="text-sm text-gray-200">{typedOrderData.payment.paymentMethod.name}</p>
                            </div>
                          )}
                          <div>
                            <span className="text-xs text-gray-400">Status</span>
                            <p className="text-sm text-gray-200">{typedOrderData.payment.status || "-"}</p>
                          </div>
                          <div>
                            <span className="text-xs text-gray-400">Amount</span>
                            <p className="text-sm text-gray-200 font-semibold">
                              {formatPrice(typedOrderData.payment.amount)}
                            </p>
                          </div>
                          {typedOrderData.payment.transactionId && (
                            <div>
                              <span className="text-xs text-gray-400">Transaction ID</span>
                              <p className="text-sm text-gray-200 font-mono break-all">
                                {typedOrderData.payment.transactionId}
                              </p>
                            </div>
                          )}
                          {typedOrderData.payment.paidAt && (
                            <div>
                              <span className="text-xs text-gray-400">Paid At</span>
                              <p className="text-sm text-gray-200">
                                {formatDateTime(typedOrderData.payment.paidAt)}
                              </p>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    )}

                    {/* Digiflazz Transaction */}
                    {typedOrderData.digiflazzTx && (
                      <Card className="bg-gray-900 border-gray-800">
                        <CardHeader>
                          <CardTitle className="flex items-center gap-2">
                            <Package className="h-5 w-5" />
                            Digiflazz Transaction
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <div>
                            <span className="text-xs text-gray-400">Status</span>
                            <p className="text-sm text-gray-200">{typedOrderData.digiflazzTx.status}</p>
                          </div>
                          {typedOrderData.digiflazzTx.trxId && (
                            <div>
                              <span className="text-xs text-gray-400">Transaction ID</span>
                              <p className="text-sm text-gray-200 font-mono break-all">
                                {typedOrderData.digiflazzTx.trxId}
                              </p>
                            </div>
                          )}
                          {typedOrderData.digiflazzTx.refId && (
                            <div>
                              <span className="text-xs text-gray-400">Reference ID</span>
                              <p className="text-sm text-gray-200 font-mono break-all">
                                {typedOrderData.digiflazzTx.refId}
                              </p>
                            </div>
                          )}
                          {typedOrderData.digiflazzTx.message && (
                            <div>
                              <span className="text-xs text-gray-400">Message</span>
                              <p className="text-sm text-gray-200">{typedOrderData.digiflazzTx.message}</p>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    )}

                    {/* Order Metadata */}
                    <Card className="bg-gray-900 border-gray-800">
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Calendar className="h-5 w-5" />
                          Metadata
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div>
                          <span className="text-xs text-gray-400">Created At</span>
                          <p className="text-sm text-gray-200">
                            {formatDateTime(typedOrderData.createdAt)}
                          </p>
                        </div>
                        <div>
                          <span className="text-xs text-gray-400">Updated At</span>
                          <p className="text-sm text-gray-200">
                            {formatDateTime(typedOrderData.updatedAt)}
                          </p>
                        </div>
                        {typedOrderData.paidAt && (
                          <div>
                            <span className="text-xs text-gray-400">Paid At</span>
                            <p className="text-sm text-gray-200">
                              {formatDateTime(typedOrderData.paidAt)}
                            </p>
                          </div>
                        )}
                        {typedOrderData.completedAt && (
                          <div>
                            <span className="text-xs text-gray-400">Completed At</span>
                            <p className="text-sm text-gray-200">
                              {formatDateTime(typedOrderData.completedAt)}
                            </p>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}

