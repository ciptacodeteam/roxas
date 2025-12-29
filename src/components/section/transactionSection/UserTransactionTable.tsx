"use client";

import { useState, useEffect } from "react";
import { Search, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import type { TransactionData } from "@/lib/data/transactionData";

export default function UserTransactionTable() {
  const [search, setSearch] = useState("");
  const [transactions, setTransactions] = useState<TransactionData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTransactions = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await fetch("/api/user/transactions");
        const data = await response.json();

        if (!response.ok || !data.success) {
          throw new Error(data.message || "Failed to fetch transactions");
        }

        // Map API response to TransactionData format
        const mappedTransactions: TransactionData[] = data.transactions.map((tx: any) => ({
          faktur: tx.faktur,
          kategori: tx.kategori,
          layanan: tx.layanan,
          tanggal: tx.tanggal,
          status: tx.status,
        }));

        setTransactions(mappedTransactions);
      } catch (err) {
        console.error("Error fetching transactions:", err);
        setError(err instanceof Error ? err.message : "Failed to load transactions");
      } finally {
        setLoading(false);
      }
    };

    fetchTransactions();
  }, []);

  const filteredData = transactions.filter((item) =>
    item.faktur.toLowerCase().includes(search.toLowerCase()),
  );

  if (loading) {
    return (
      <div className="mx-auto max-w-7xl">
        <div className="bg-card mb-14 rounded-lg p-8">
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-rose-500" />
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
            <p className="text-red-400 mb-2">❌ {error}</p>
            <button
              onClick={() => window.location.reload()}
              className="mt-4 rounded-lg bg-rose-500 px-4 py-2 text-white hover:bg-rose-600"
            >
              Coba Lagi
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl">
      <div className="bg-card mb-14 rounded-lg p-8">
        {/* SEARCH FIELD */}
        <div className="mb-5">
          <div className="relative w-full">
            <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-white" />
            <Input
              type="text"
              placeholder="Cari Nomor Invoice..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="border-ring/50 bg-muted-foreground w-full rounded-full pl-10 text-white placeholder:text-white"
            />
          </div>
        </div>

        <div className="overflow-hidden rounded-lg border border-gray-700">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="bg-gray-800 text-white">
                <th className="border border-gray-700 px-4 py-3 text-left">
                  Faktur
                </th>
                <th className="border border-gray-700 px-4 py-3 text-left">
                  Kategori
                </th>
                <th className="border border-gray-700 px-4 py-3 text-left">
                  Layanan
                </th>
                <th className="border border-gray-700 px-4 py-3 text-left">
                  Tanggal
                </th>
                <th className="border border-gray-700 px-4 py-3 text-left">
                  Status
                </th>
              </tr>
            </thead>

            <tbody className="text-white">
              {filteredData.length > 0 ? (
                filteredData.map((item: TransactionData, i) => (
                  <tr key={i} className="transition hover:bg-gray-800">
                    <td className="border border-gray-700 px-4 py-3">
                      {item.faktur}
                    </td>
                    <td className="border border-gray-700 px-4 py-3">
                      {item.kategori}
                    </td>
                    <td className="border border-gray-700 px-4 py-3">
                      {item.layanan}
                    </td>
                    <td className="border border-gray-700 px-4 py-3">
                      {item.tanggal}
                    </td>
                    <td className="border border-gray-700 px-4 py-3">
                      <span
                        className={`rounded px-2 py-1 text-xs font-semibold ${
                          item.status === "Sukses"
                            ? "bg-green-600/20 text-green-400"
                            : item.status === "Kadaluarsa"
                              ? "bg-gray-600/20 text-gray-400"
                              : "bg-red-600/20 text-red-400"
                        }`}
                      >
                        {item.status}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan={5}
                    className="border border-gray-700 py-6 text-center text-gray-400"
                  >
                    {transactions.length === 0
                      ? "📭 Belum ada transaksi"
                      : "🔍 Faktur tidak ditemukan"}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

