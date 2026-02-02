/**
 * Transaction Detail Page
 * Displays detailed information about a single transaction/order
 */

"use client";

import { useParams, useRouter } from "next/navigation";
import { useOrderDetail } from "@/lib/transaction/queries";
import { TransactionStatusCard, OrderInformationCard, PaymentInformationCard } from "@/components/transaction/TransactionDetailCards";
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
        <div className="mx-auto max-w-5xl px-4 pb-12 pt-40">
            {/* Header */}
            <div className="mb-8">
                <Button
                    variant="ghost"
                    onClick={() => router.push("/id/transaction")}
                    className="mb-4 gap-2 text-white/70 hover:text-white"
                >
                    <ArrowLeft className="h-4 w-4" />
                    Kembali
                </Button>
                <h1 className="text-3xl font-bold text-white">Detail Transaksi</h1>
                <p className="mt-2 text-white/60">Informasi lengkap tentang pesanan Anda</p>
            </div>

            {/* Content Grid */}
            <div className="grid gap-6 lg:grid-cols-2">
                {/* Left Column */}
                <div className="space-y-6">
                    <TransactionStatusCard order={order} />
                    <OrderInformationCard order={order} />
                </div>

                {/* Right Column */}
                <div className="space-y-6">
                    <PaymentInformationCard order={order} />
                </div>
            </div>

            {/* Footer Note */}
            <div className="mt-8 rounded-lg border border-white/10 bg-white/5 p-4">
                <p className="text-sm text-white/50">
                    💡 <strong className="text-white/70">Tips:</strong> Simpan nomor pesanan Anda untuk referensi di masa mendatang.
                    Jika ada kendala, hubungi customer service dengan menyertakan nomor pesanan.
                </p>
            </div>
        </div>
    );
}
