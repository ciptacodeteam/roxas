/**
 * Transaction Detail Page
 * Displays detailed information about a single transaction/order
 */

"use client";

import { useParams, useRouter } from "next/navigation";
import { useOrderDetail } from "@/lib/transaction/queries";
import { TransactionStatusCard, OrderInformationCard, PaymentInformationCard, DigiflazzTransactionCard } from "@/components/transaction/TransactionDetailCards";
import { ArrowLeft, Loader2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function TransactionDetailPage() {
    const params = useParams();
    const router = useRouter();
    const orderId = params?.id as string | undefined;

    const { data: order, isLoading, error } = useOrderDetail(orderId || null);

    // Loading state
    if (isLoading) {
        return (
            <div className="flex min-h-screen items-center justify-center">
                <div className="text-center">
                    <Loader2 className="mx-auto h-12 w-12 animate-spin text-white/40" />
                    <p className="mt-4 text-white/60">Memuat detail transaksi...</p>
                </div>
            </div>
        );
    }

    // Error state - Transaction not found
    if (error || !order) {
        return (
            <div className="flex min-h-screen items-center justify-center px-4">
                <div className="max-w-md text-center">
                    <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-red-500/20">
                        <AlertCircle className="h-10 w-10 text-red-400" />
                    </div>
                    <h1 className="mb-2 text-2xl font-bold text-white">Transaksi Tidak Ditemukan</h1>
                    <p className="mb-6 text-white/60">
                        {error?.message || "Transaksi yang Anda cari tidak ditemukan atau tidak dapat diakses."}
                    </p>
                    <Button
                        onClick={() => router.push("/id/transaction")}
                        className="gap-2 bg-blue-600 text-white hover:bg-blue-700"
                    >
                        <ArrowLeft className="h-4 w-4" />
                        Kembali ke Daftar Transaksi
                    </Button>
                </div>
            </div>
        );
    }

    // Success state - Display transaction details
    return (
        <div className="min-h-screen bg-gradient-to-b from-card via-muted-foreground to-foreground/20 text-white">
            <div className="mx-auto max-w-7xl px-4 pb-14 pt-40">
                {/* Header */}
                <div className="mb-10">
                    <Button
                        variant="ghost"
                        onClick={() => router.push("/id/transaction")}
                        className="mb-6 gap-2 text-white/70 hover:bg-white/10 hover:text-white"
                    >
                        <ArrowLeft className="h-4 w-4" />
                        Kembali
                    </Button>
                    <div className="text-center">
                        <p className="mb-2 text-sm text-gray-400">Detail Transaksi</p>
                        <h1 className="text-2xl font-semibold">Informasi lengkap tentang pesanan Anda</h1>
                        <p className="mt-2 text-sm text-gray-400">
                            Nomor Pesanan:{" "}
                            <span className="font-medium text-white">{order.order_number}</span>
                        </p>
                    </div>
                </div>

                {/* Content Grid */}
                <div className="grid gap-6 lg:grid-cols-3">
                    {/* Left Column - Spans 2 columns */}
                    <div className="space-y-6 lg:col-span-2">
                        <OrderInformationCard order={order} />
                        <TransactionStatusCard order={order} />
                        <DigiflazzTransactionCard order={order} />
                    </div>

                    {/* Right Column */}
                    <div className="space-y-6">
                        <PaymentInformationCard order={order} />
                    </div>
                </div>

                {/* Footer Note */}
                <div className="mt-8 rounded-2xl bg-slate-800/70 p-4 border border-white/10">
                    <p className="text-sm text-white/60">
                        💡 <strong className="text-white">Tips:</strong> Simpan nomor pesanan Anda untuk referensi di masa mendatang.
                        Jika ada kendala, hubungi customer service dengan menyertakan nomor pesanan.
                    </p>
                </div>
            </div>
        </div>
    );
}
