/**
 * Public Invoice Lookup Page
 * Anyone can check their order status by entering their invoice number — no login needed.
 */

"use client";

import { useState } from "react";
import { Search, Loader2, Package, CheckCircle2, Clock, AlertCircle, XCircle, RefreshCw } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { getOrderStatusInfo, formatCurrency, formatDate } from "@/lib/transaction/utils";
import type { OrderStatus } from "@/lib/transaction/types";
import { API_URL } from "@/lib/api-url";

interface LookupResult {
  order_number: string;
  status: OrderStatus;
  product_name: string;
  total_amount: number;
  payment_method_name: string | null;
  created_at: string;
  paid_at: string | null;
  completed_at: string | null;
}

const STATUS_ICON_MAP: Record<string, React.ElementType> = {
  COMPLETED: CheckCircle2,
  PAID: CheckCircle2,
  PROCESSING: RefreshCw,
  PENDING: Clock,
  FAILED: XCircle,
  EXPIRED: XCircle,
  REFUNDED: RefreshCw,
  CANCELLED: XCircle,
};

export default function TransactionPage() {
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<LookupResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    const invoice = input.trim().toUpperCase();
    if (!invoice) return;

    setLoading(true);
    setResult(null);
    setError(null);

    try {
      const res = await fetch(
        `${API_URL}/api/v1/orders/lookup/?invoice=${encodeURIComponent(invoice)}`,
        { cache: "no-store" }
      );
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Nomor invoice tidak ditemukan.");
      } else {
        setResult(data as LookupResult);
      }
    } catch {
      setError("Terjadi kesalahan jaringan. Silakan coba lagi.");
    } finally {
      setLoading(false);
    }
  };

  const statusInfo = result ? getOrderStatusInfo(result.status) : null;
  const StatusIcon = result ? (STATUS_ICON_MAP[result.status] ?? Package) : null;

  return (
    <div className="mx-auto max-w-2xl px-4 pb-20 pt-40">
      {/* Header */}
      <div className="mb-10 text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-white/10">
          <Search className="h-7 w-7 text-white" />
        </div>
        <h1 className="text-3xl font-bold text-white">Cek Status Pesanan</h1>
        <p className="mt-2 text-white/60">
          Masukkan nomor invoice untuk melihat status pesanan Anda.
          <br />
          Tidak perlu login.
        </p>
      </div>

      {/* Search Form */}
      <form onSubmit={handleSearch} className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-white/40" />
          <Input
            type="text"
            placeholder="Contoh: ROX-20260226-ABCD"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            className="border-white/10 bg-white/5 pl-10 text-white placeholder:text-white/30 focus:border-white/20 uppercase"
          />
        </div>
        <Button
          type="submit"
          disabled={loading || !input.trim()}
          className="gap-2 bg-primary text-primary-foreground hover:bg-primary/90"
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
          Cari
        </Button>
      </form>

      {/* Error */}
      {error && (
        <div className="mt-8 flex items-start gap-3 rounded-xl border border-red-500/30 bg-red-500/10 p-5">
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-400" />
          <div>
            <p className="font-medium text-red-400">Tidak Ditemukan</p>
            <p className="mt-1 text-sm text-white/60">{error}</p>
          </div>
        </div>
      )}

      {/* Result Card */}
      {result && statusInfo && StatusIcon && (
        <div className="mt-8 overflow-hidden rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm">
          {/* Status banner */}
          <div className={`flex items-center gap-3 border-b border-white/10 px-6 py-4 ${statusInfo.color}`}>
            <StatusIcon className="h-6 w-6" />
            <div>
              <p className="text-xs font-medium uppercase tracking-wider opacity-70">Status Pesanan</p>
              <p className="text-lg font-bold">{statusInfo.label}</p>
            </div>
          </div>

          {/* Details */}
          <div className="divide-y divide-white/5 px-6">
            <Row label="Nomor Invoice" value={result.order_number} mono />
            <Row label="Produk" value={result.product_name} />
            <Row label="Total" value={formatCurrency(result.total_amount)} />
            {result.payment_method_name && (
              <Row label="Metode Pembayaran" value={result.payment_method_name} />
            )}
            <Row label="Waktu Pesan" value={formatDate(result.created_at)} />
            {result.paid_at && (
              <Row label="Waktu Bayar" value={formatDate(result.paid_at)} />
            )}
            {result.completed_at && (
              <Row label="Selesai" value={formatDate(result.completed_at)} />
            )}
          </div>

          {/* Description hint */}
          <p className="px-6 py-4 text-sm text-white/40">{statusInfo.description}</p>
        </div>
      )}

      {/* Empty hint when nothing searched yet */}
      {!result && !error && !loading && (
        <p className="mt-10 text-center text-sm text-white/30">
          Nomor invoice dapat ditemukan di email konfirmasi pesanan Anda.
        </p>
      )}
    </div>
  );
}

function Row({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-4 py-3">
      <span className="text-sm text-white/50">{label}</span>
      <span className={`text-right text-sm font-medium text-white ${mono ? "font-mono" : ""}`}>
        {value}
      </span>
    </div>
  );
}
