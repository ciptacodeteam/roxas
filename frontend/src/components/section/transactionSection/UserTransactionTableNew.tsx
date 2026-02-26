"use client";

import { useState } from "react";
import { Search, Loader2, RefreshCw, Eye } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useUserTransactions } from "@/lib/transaction/queries";
import {
  getStatusColor,
  getStatusLabel,
  formatCurrency,
  formatDate,
} from "@/lib/transaction/utils";

export default function UserTransactionTable() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string | undefined>(undefined);
  const params = useParams();
  const locale = (params?.locale as string) || "id";

  const { data, isLoading, error, refetch } = useUserTransactions({
    search: search || undefined,
    status: statusFilter as any,
  });

  const transactions = data?.results || [];

  if (isLoading) {
    return (
      <div className="mx-auto max-w-7xl">
        <div className="bg-card mb-14 rounded-lg p-8">
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <span className="ml-3 text-white">Memuat transaksi...</span>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto max-w-7xl">
        <div className="bg-card mb-14 rounded-lg p-8">
          <div className="flex flex-col items-center justify-center py-12">
            <p className="text-red-400 mb-2">❌ {error.message}</p>
            <Button
              onClick={() => refetch()}
              className="mt-4 bg-primary hover:bg-primary/90"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Coba Lagi
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl">
      <div className="bg-card mb-14 rounded-lg p-8">
        {/* Search and Filter */}
        <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-white" />
            <Input
              type="text"
              placeholder="Cari Nomor Invoice..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="border-ring/50 bg-muted-foreground w-full rounded-full pl-10 text-white placeholder:text-white"
            />
          </div>

          <select
            value={statusFilter || ""}
            onChange={(e) => setStatusFilter(e.target.value || undefined)}
            className="bg-muted-foreground border-ring/50 rounded-full px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="">Semua Status</option>
            <option value="PENDING">Menunggu Pembayaran</option>
            <option value="PAID">Dibayar</option>
            <option value="PROCESSING">Diproses</option>
            <option value="COMPLETED">Selesai</option>
            <option value="FAILED">Gagal</option>
            <option value="EXPIRED">Kedaluwarsa</option>
          </select>
        </div>

        {/* Table */}
        <div className="overflow-hidden rounded-lg border border-gray-700">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="bg-gray-800 text-white">
                <th className="border border-gray-700 px-4 py-3 text-left">
                  No. Invoice
                </th>
                <th className="border border-gray-700 px-4 py-3 text-left">
                  Produk
                </th>
                <th className="border border-gray-700 px-4 py-3 text-left">
                  Total
                </th>
                <th className="border border-gray-700 px-4 py-3 text-left">
                  Pembayaran
                </th>
                <th className="border border-gray-700 px-4 py-3 text-left">
                  Tanggal
                </th>
                <th className="border border-gray-700 px-4 py-3 text-left">
                  Status
                </th>
                <th className="border border-gray-700 px-4 py-3 text-left">
                  Aksi
                </th>
              </tr>
            </thead>

            <tbody className="text-white">
              {transactions.length > 0 ? (
                transactions.map((transaction) => (
                  <tr
                    key={transaction.id}
                    className="transition hover:bg-gray-800"
                  >
                    <td className="border border-gray-700 px-4 py-3">
                      {transaction.order_number}
                    </td>
                    <td className="border border-gray-700 px-4 py-3">
                      {transaction.product_item_name}
                    </td>
                    <td className="border border-gray-700 px-4 py-3">
                      {formatCurrency(transaction.total_amount)}
                    </td>
                    <td className="border border-gray-700 px-4 py-3">
                      {transaction.payment_method_name || "-"}
                    </td>
                    <td className="border border-gray-700 px-4 py-3">
                      {formatDate(transaction.created_at)}
                    </td>
                    <td className="border border-gray-700 px-4 py-3">
                      <span
                        className={`rounded px-2 py-1 text-xs font-semibold ${
                          getStatusColor(transaction.status)
                        }`}
                      >
                        {getStatusLabel(transaction.status)}
                      </span>
                    </td>
                    <td className="border border-gray-700 px-4 py-3">
                      <Link href={`/${locale}/transaction/${transaction.id}`}>
                        <Button
                          size="sm"
                          variant="outline"
                          className="bg-transparent border-gray-600 text-white hover:bg-gray-700 hover:border-gray-500"
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          Detail
                        </Button>
                      </Link>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan={7}
                    className="border border-gray-700 py-6 text-center text-gray-400"
                  >
                    {search
                      ? "🔍 Transaksi tidak ditemukan"
                      : "📭 Belum ada transaksi"}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Info */}
        {data && data.count > 0 && (
          <div className="mt-4 text-sm text-gray-400 text-center">
            Menampilkan {transactions.length} dari {data.count} transaksi
          </div>
        )}
      </div>
    </div>
  );
}
