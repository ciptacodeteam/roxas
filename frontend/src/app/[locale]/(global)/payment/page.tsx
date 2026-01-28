"use client";

import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";
// QR Code will be generated from payment URL or displayed as image

export default function PaymentPage() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get("orderId");
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [timeLeft, setTimeLeft] = useState<string>("");

  const fetchOrder = async () => {
    if (!orderId) return;
    
    try {
      const response = await fetch(`/api/orders/${orderId}`, {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache',
        },
      });
      const data = await response.json();
      if (data.success) {
        setOrder(data.data);
      }
    } catch (error) {
      console.error("Failed to fetch order:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!orderId) {
      setLoading(false);
      return;
    }

    fetchOrder();
    
    // Poll for order updates every 5 seconds if payment is pending
    const pollInterval = setInterval(() => {
      fetchOrder();
    }, 5000);

    return () => clearInterval(pollInterval);
  }, [orderId]);

  // Separate effect for countdown timer
  useEffect(() => {
    if (!order?.payment?.expiresAt) return;

    const expiresAt = new Date(order.payment.expiresAt);
    const updateTimeLeft = () => {
      const now = new Date();
      const diff = expiresAt.getTime() - now.getTime();
      
      if (diff <= 0) {
        setTimeLeft("Expired");
        return;
      }
      
      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);
      
      setTimeLeft(`${hours}h ${minutes}m ${seconds}s`);
    };
    
    updateTimeLeft();
    const interval = setInterval(updateTimeLeft, 1000);
    return () => clearInterval(interval);
  }, [order?.payment?.expiresAt]);

  if (loading) {
    return (
      <div className="from-card via-muted-foreground to-foreground/20 flex min-h-screen items-center justify-center bg-linear-to-b text-white">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin" />
          <p>Memuat data pembayaran...</p>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="from-card via-muted-foreground to-foreground/20 flex min-h-screen items-center justify-center bg-linear-to-b text-white">
        <div className="text-center">
          <h1 className="text-2xl font-semibold mb-2">Pesanan tidak ditemukan</h1>
          <p className="text-gray-400">Silakan cek kembali link pembayaran Anda.</p>
        </div>
      </div>
    );
  }

  const payment = order.payment;
  const paymentMethod = payment?.paymentMethod;
  const customerData = order.customerData as any;

  // Generate QR code if QRIS string exists
  const qrCodeValue = payment?.qrisString || payment?.paymentUrl;

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
              {order.orderNumber}
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
              <Row label="Pembelian produk">
                {order.productItem?.product?.name} - {order.productItem?.name}
              </Row>

              <Row label="Nomor Invoice">{order.orderNumber}</Row>

              <Row label="Status Transaksi">
                <Badge className={order.status === "PENDING" ? "bg-yellow-400 text-black" : "bg-green-500"}>
                  {order.status}
                </Badge>
              </Row>

              <Row label="Status Pembayaran">
                <Badge className={payment?.status === "PENDING" ? "bg-red-500" : "bg-green-500"}>
                  {payment?.status || "PENDING"}
                </Badge>
              </Row>

              {payment?.paidAt && (
                <Row label="Waktu Pembayaran">
                  {new Date(payment.paidAt).toLocaleString("id-ID")}
                </Row>
              )}

              {/* RINCIAN PEMBAYARAN */}
              <div className="space-y-2 border-t border-white/10 pt-3">
                <div className="flex justify-between text-gray-400">
                  <span>Harga Item</span>
                  <span>Rp {order.finalPrice.toLocaleString("id-ID")}</span>
                </div>

                {order.paymentFee > 0 && (
                  <div className="flex justify-between text-gray-400">
                    <span>Biaya Layanan</span>
                    <span>Rp {order.paymentFee.toLocaleString("id-ID")}</span>
                  </div>
                )}

                {order.vatAmount > 0 && (
                  <div className="flex justify-between text-gray-400">
                    <span>PPN</span>
                    <span>Rp {order.vatAmount.toLocaleString("id-ID")}</span>
                  </div>
                )}
              </div>

              {/* TOTAL */}
              <div className="border-t border-white/10 pt-4">
                <div className="flex justify-between text-base font-semibold">
                  <span>Total Pembayaran</span>
                  <span>Rp {order.totalAmount.toLocaleString("id-ID")}</span>
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT - PAYMENT */}
          <div className="space-y-4 rounded-2xl bg-slate-800/70 p-6">
            {payment?.expiresAt && (
              <div>
                <p className="mb-2 text-sm text-gray-400">
                  Pesanan ini akan kedaluwarsa pada
                </p>
                <div className="rounded-full bg-primary/70 px-4 py-2 text-center text-sm font-medium">
                  {timeLeft || "Calculating..."}
                </div>
                <p className="mt-2 text-xs text-gray-500 text-center">
                  {new Date(payment.expiresAt).toLocaleString("id-ID")}
                </p>
              </div>
            )}

            <div>
              <p className="text-sm text-gray-400">Metode Pembayaran</p>
              <p className="mt-1 font-medium">{paymentMethod?.name || "-"}</p>
            </div>

            {/* QR Code for QRIS */}
            {qrCodeValue && paymentMethod?.type === "QRIS" && (
              <>
                <div className="flex justify-center rounded-xl bg-white p-4">
                  {payment.paymentUrl ? (
                    <Image
                      src={payment.paymentUrl}
                      alt="QR Code"
                      width={220}
                      height={220}
                      className="w-full h-auto"
                    />
                  ) : (
                    <div className="flex items-center justify-center h-[220px] w-[220px] bg-gray-100">
                      <p className="text-gray-500 text-sm text-center p-4">
                        Scan QR Code dengan aplikasi pembayaran Anda
                        <br />
                        <span className="font-mono text-xs break-all mt-2 block">
                          {qrCodeValue.length > 50 ? `${qrCodeValue.substring(0, 50)}...` : qrCodeValue}
                        </span>
                      </p>
                    </div>
                  )}
                </div>
                <Button
                  className="w-full bg-primary text-white cursor-pointer"
                  onClick={() => {
                    if (payment.paymentUrl) {
                      window.open(payment.paymentUrl, "_blank");
                    } else {
                      navigator.clipboard.writeText(qrCodeValue);
                      alert("QR Code string telah disalin!");
                    }
                  }}
                >
                  {payment.paymentUrl ? "Buka QR Code" : "Salin QR Code"}
                </Button>
              </>
            )}

            {/* Virtual Account Number */}
            {payment?.vaNumber && (
              <div className="space-y-2">
                <p className="text-sm text-gray-400">Nomor Virtual Account</p>
                <div className="rounded-lg bg-gray-700 p-4">
                  <p className="text-center text-xl font-mono font-semibold">
                    {payment.vaNumber}
                  </p>
                </div>
                <Button
                  className="w-full bg-primary text-white cursor-pointer"
                  onClick={() => {
                    navigator.clipboard.writeText(payment.vaNumber);
                    alert("Nomor VA telah disalin!");
                  }}
                >
                  Salin Nomor VA
                </Button>
              </div>
            )}

            {/* Deep Link for E-Wallets */}
            {payment?.deeplinkUrl && (
              <Button
                className="w-full bg-primary text-white cursor-pointer"
                onClick={() => {
                  window.open(payment.deeplinkUrl, "_blank");
                }}
              >
                Buka Aplikasi Pembayaran
              </Button>
            )}

            {/* Redirect URL for Credit Card */}
            {payment?.redirectUrl && paymentMethod?.type === "CREDIT_CARD" && (
              <Button
                className="w-full bg-primary text-white cursor-pointer"
                onClick={() => {
                  window.open(payment.redirectUrl, "_blank");
                }}
              >
                Lanjutkan Pembayaran
              </Button>
            )}
          </div>
        </div>

        {/* INFORMASI AKUN */}
        {customerData && (customerData.userId || customerData.serverId || customerData.zoneId) && (
          <div className="mt-6 rounded-2xl bg-slate-800/70 p-6">
            <h2 className="mb-4 font-semibold">Informasi Akun</h2>

            <div className="grid grid-cols-1 gap-4 text-sm sm:grid-cols-3">
              {customerData.userId && (
                <Info label="User ID" value={customerData.userId} />
              )}
              {customerData.serverId && (
                <Info label="Server ID" value={customerData.serverId} />
              )}
              {customerData.zoneId && (
                <Info label="Zone ID" value={customerData.zoneId} />
              )}
            </div>
          </div>
        )}
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
