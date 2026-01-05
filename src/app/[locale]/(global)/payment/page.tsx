"use client";

import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default function PaymentPage() {
  return (
    <div className="from-card via-muted-foreground to-foreground/20 min-h-screen bg-linear-to-b text-white">
      <div className="mx-auto max-w-7xl pt-38 pb-14">
        {/* HEADER */}
        <div className="mb-10 text-center">
          <p className="mb-2 text-sm text-gray-400">Terima Kasih!</p>
          <h1 className="text-2xl font-semibold">Harap lengkapi pembayaran.</h1>
          <p className="mt-2 text-sm text-gray-400">
            Pesanan kamu{" "}
            <span className="font-medium text-white">
              VS00C72EA11D38AC781303804
            </span>{" "}
            menunggu pembayaran sebelum dikirim.
          </p>
        </div>

        {/* MAIN GRID */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* LEFT - DETAIL PEMBELIAN */}
          <div className="rounded-2xl bg-slate-800/70 p-6 lg:col-span-2">
            <h2 className="mb-4 font-semibold">Detail Pembelian</h2>

            <div className="space-y-3 text-sm">
              <Row label="Pembelian produk">Mobile Legends (5+40) Diamonds</Row>

              <Row label="Nomor Invoice">VS00C72EA11D38AC781303804</Row>

              <Row label="Status Transaksi">
                <Badge className="bg-yellow-400 text-black">PENDING</Badge>
              </Row>

              <Row label="Status Pembayaran">
                <Badge className="bg-red-500">UNPAID</Badge>
              </Row>

              <Row label="Pesan">
                Your order is being processed. Please wait.
              </Row>

              {/* RINCIAN PEMBAYARAN */}
              <div className="space-y-2 border-t border-white/10 pt-3">
                <div className="flex justify-between text-gray-400">
                  <span>Harga Item</span>
                  <span>Rp 1.400</span>
                </div>

                <div className="flex justify-between text-gray-400">
                  <span>Biaya Admin</span>
                  <span>Rp 123</span>
                </div>
              </div>

              {/* TOTAL */}
              <div className="border-t border-white/10 pt-4">
                <div className="flex justify-between text-base font-semibold">
                  <span>Total Pembayaran</span>
                  <span>Rp 1.523</span>
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT - PAYMENT */}
          <div className="space-y-4 rounded-2xl bg-slate-800/70 p-6">
            <div>
              <p className="mb-2 text-sm text-gray-400">
                Pesanan ini akan kedaluwarsa pada
              </p>
              <div className="rounded-full bg-primary/70 px-4 py-2 text-center text-sm font-medium">
                2 hours, 59 minutes, 45 seconds left
              </div>
            </div>

            <div>
              <p className="text-sm text-gray-400">Metode Pembayaran</p>
              <p className="mt-1 font-medium">QRIS (All Payment)</p>
            </div>

            <div className="flex justify-center rounded-xl bg-white p-2">
              <Image
                src="/img/qrcode.jpg" // ganti QR asli
                alt="QR Code"
                width={220}
                height={220}
              />
            </div>

            <Button className="w-full bg-primary text-white cursor-pointer">
              Unduh Kode QR
            </Button>
          </div>
        </div>

        {/* INFORMASI AKUN */}
        <div className="mt-6 rounded-2xl bg-slate-800/70 p-6">
          <h2 className="mb-4 font-semibold">Informasi Akun</h2>

          <div className="grid grid-cols-1 gap-4 text-sm sm:grid-cols-3">
            <Info label="Nickname" value="Psykoo" />
            <Info label="ID" value="87109612" />
            <Info label="Server" value="2172" />
          </div>
        </div>
      </div>
    </div>
  );
}

/* COMPONENT KECIL */
function Row({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="text-gray-400">{label}</span>
      <span className="text-right">{children}</span>
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-gray-400">{label}</p>
      <p className="font-medium">{value}</p>
    </div>
  );
}
