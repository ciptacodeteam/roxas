/**
 * Transaction Page
 * Shows user's transaction list with links to individual transaction details
 */

"use client";

import { useState } from "react";
import { useUserTransactions } from "@/lib/transaction/queries";
import { getOrderStatusInfo, formatCurrency, formatDate } from "@/lib/transaction/utils";
import { useRouter } from "next/navigation";
import { Loader2, Search, Package, AlertCircle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function TransactionPage() {
  const router = useRouter();
  const [searchInput, setSearchInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const { data, isLoading, error } = useUserTransactions({ search: searchQuery });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearchQuery(searchInput);
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <Loader2 className="mx-auto h-12 w-12 animate-spin text-white/40" />
          <p className="mt-4 text-white/60">Memuat transaksi...</p>
        </div>
      </div>
    );
  }

  const transactions = data?.results || [];

  return (
    <div className="mx-auto max-w-6xl px-4 pb-12 pt-40">
      <div>
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white">Riwayat Transaksi</h1>
          <p className="mt-2 text-white/60">Lihat semua transaksi yang telah Anda lakukan</p>
        </div>

        {/* Search */}
        <div className="mb-6">
          <form onSubmit={handleSearch} className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-white/40" />
              <Input
                type="text"
                placeholder="Cari nomor pesanan..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="border-white/10 bg-white/5 pl-10 text-white placeholder:text-white/40 focus:border-white/20"
              />
            </div>
            <Button
              type="submit"
              className="gap-2 bg-primary text-primary-foreground hover:bg-primary/90"
            >
              <Search className="h-4 w-4" />
              Cari
            </Button>
          </form>
        </div>

        {/* Error State */}
        {error && (
          <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-6 text-center">
            <AlertCircle className="mx-auto h-12 w-12 text-red-400" />
            <p className="mt-4 font-medium text-red-400">Gagal memuat transaksi</p>
            <p className="mt-2 text-sm text-white/60">{error.message}</p>
          </div>
        )}

        {/* Empty State */}
        {!error && transactions.length === 0 && (
          <div className="rounded-lg border border-white/10 bg-white/5 p-12 text-center">
            <Package className="mx-auto h-16 w-16 text-white/20" />
            <h3 className="mt-4 text-lg font-semibold text-white">Belum Ada Transaksi</h3>
            <p className="mt-2 text-white/60">
              {searchQuery ? "Tidak ada transaksi yang cocok dengan pencarian Anda" : "Anda belum melakukan transaksi apapun"}
            </p>
          </div>
        )}

        {/* Transaction List */}
        {!error && transactions.length > 0 && (
          <div className="space-y-4">
            {transactions.map((transaction) => {
              const statusInfo = getOrderStatusInfo(transaction.status);
              return (
                <button
                  key={transaction.id}
                  onClick={() => router.push(`/id/transaction/${transaction.id}`)}
                  className="w-full rounded-xl border border-white/10 bg-gradient-to-br from-white/5 to-white/[0.02] p-6 text-left backdrop-blur-sm transition-all hover:border-white/20 hover:from-white/10 hover:to-white/5"
                >
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{statusInfo.icon}</span>
                        <div>
                          <h3 className="font-semibold text-white">{transaction.product_item_name}</h3>
                          <p className="text-sm text-white/60">#{transaction.order_number}</p>
                        </div>
                      </div>
                      <div className="mt-3 flex flex-wrap gap-4 text-sm">
                        <div>
                          <span className="text-white/50">Total: </span>
                          <span className="font-semibold text-white">{formatCurrency(transaction.total_amount)}</span>
                        </div>
                        <div>
                          <span className="text-white/50">Metode: </span>
                          <span className="text-white">{transaction.payment_method_name || "-"}</span>
                        </div>
                        <div>
                          <span className="text-white/50">Waktu: </span>
                          <span className="text-white">{formatDate(transaction.created_at)}</span>
                        </div>
                      </div>
                    </div>
                    <div className={`self-start rounded-lg border px-3 py-1.5 text-sm font-medium ${statusInfo.color}`}>
                      {statusInfo.label}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}

        {/* Pagination Info */}
        {data && data.count > 0 && (
          <div className="mt-6 text-center text-sm text-white/50">
            Menampilkan {transactions.length} dari {data.count} transaksi
          </div>
        )}
      </div>
    </div>
  );
}

