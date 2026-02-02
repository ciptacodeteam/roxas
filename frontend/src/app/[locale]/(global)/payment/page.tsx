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
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
      const response = await fetch(`${apiUrl}/api/v1/orders/${orderId}/`, {
        credentials: 'include',
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache',
        },
      });
      
      if (!response.ok) {
        console.error("Failed to fetch order:", response.status);
        setLoading(false);
        return;
      }
      
      const data = await response.json();
      setOrder(data);
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
    if (!order?.payment?.expires_at) {
      console.log("No expires_at found:", order?.payment);
      return;
    }

    console.log("Setting up countdown for:", order.payment.expires_at);
    const expiresAt = new Date(order.payment.expires_at);
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
  }, [order?.payment?.expires_at]);

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
  const paymentMethod = payment?.payment_method;
  const customerData = order.customer_data as any;

  // For QRIS payments, prioritize qris_string over payment_url
  const qrCodeValue = payment?.qris_string || payment?.payment_url;
  // Only show QR code if payment method type is explicitly QRIS
  const isQRISPayment = paymentMethod?.type === "QRIS";

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
              {order.order_number}
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
                {order.product_item?.product?.name} - {order.product_item?.name}
              </Row>

              <Row label="Nomor Invoice">{order.order_number}</Row>

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
                  <span>Harga Produk</span>
                  <span>Rp {order.original_price.toLocaleString("id-ID")}</span>
                </div>

                {order.original_price !== order.final_price && (
                  <div className="flex justify-between text-gray-400">
                    <span>Harga Setelah Diskon</span>
                    <span>Rp {order.final_price.toLocaleString("id-ID")}</span>
                  </div>
                )}

                {order.payment_fee > 0 && (
                  <div className="flex justify-between text-gray-400">
                    <span>Biaya Pembayaran</span>
                    <span>Rp {order.payment_fee.toLocaleString("id-ID")}</span>
                  </div>
                )}

                {order.vat_amount > 0 && (
                  <div className="flex justify-between text-gray-400">
                    <span>PPN</span>
                    <span>Rp {order.vat_amount.toLocaleString("id-ID")}</span>
                  </div>
                )}
              </div>

              {/* TOTAL */}
              <div className="border-t border-white/10 pt-4">
                <div className="flex justify-between text-base font-semibold">
                  <span>Total Pembayaran</span>
                  <span>Rp {order.total_amount.toLocaleString("id-ID")}</span>
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT - PAYMENT */}
          <div className="space-y-4 rounded-2xl bg-slate-800/70 p-6">
            {payment?.expires_at && (
              <div>
                <p className="mb-2 text-sm text-gray-400">
                  Pesanan ini akan kedaluwarsa pada
                </p>
                <div className="rounded-full bg-primary/70 px-4 py-2 text-center text-sm font-medium">
                  {timeLeft || "Calculating..."}
                </div>
                <p className="mt-2 text-xs text-gray-500 text-center">
                  {new Date(payment.expires_at).toLocaleString("id-ID")}
                </p>
              </div>
            )}

            <div>
              <p className="text-sm text-gray-400">Metode Pembayaran</p>
              <p className="mt-1 font-medium">{paymentMethod?.name || "-"}</p>
            </div>

            {/* QR Code for QRIS */}
            {isQRISPayment && (
              <>
                <div className="space-y-2">
                  <p className="text-sm text-gray-400">Scan QR Code untuk Membayar</p>
                  <div className="flex justify-center rounded-xl bg-white p-4">
                    {qrCodeValue ? (
                      <div className="flex flex-col items-center gap-2">
                        {qrCodeValue.startsWith('http') ? (
                          <Image
                            src={qrCodeValue}
                            alt="QRIS QR Code"
                            width={256}
                            height={256}
                            className="w-64 h-64 object-contain"
                          />
                        ) : (
                          <div className="flex items-center justify-center p-4 bg-gray-50 rounded">
                            <div className="text-center">
                              <p className="text-gray-700 text-xs mb-2">
                                Scan dengan aplikasi pembayaran
                              </p>
                              <p className="font-mono text-[10px] text-gray-600 break-all max-w-[200px]">
                                {qrCodeValue.substring(0, 100)}...
                              </p>
                            </div>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="flex items-center justify-center h-[220px] w-[220px] bg-gray-100">
                        <p className="text-gray-500 text-sm text-center p-4">
                          Memuat QR Code...
                        </p>
                      </div>
                    )}
                  </div>
                </div>
                {qrCodeValue && (
                  <Button
                    className="w-full bg-primary text-white cursor-pointer"
                    onClick={() => {
                      if (qrCodeValue.startsWith('http')) {
                        window.open(qrCodeValue, "_blank");
                      } else {
                        navigator.clipboard.writeText(qrCodeValue);
                        alert("QR Code string telah disalin!");
                      }
                    }}
                  >
                    {qrCodeValue.startsWith('http') ? "Buka QR Code di Tab Baru" : "Salin QR Code"}
                  </Button>
                )}
              </>
            )}

            {/* Virtual Account Number */}
            {payment?.va_number && (
              <div className="space-y-2">
                <p className="text-sm text-gray-400">Nomor Virtual Account</p>
                {paymentMethod?.name && (
                  <p className="text-xs text-gray-500">Bank: {paymentMethod.name}</p>
                )}
                <div className="rounded-lg bg-gray-700 p-4">
                  <p className="text-center text-xl font-mono font-semibold">
                    {payment.va_number}
                  </p>
                </div>
                <p className="text-xs text-gray-500">Gunakan nomor ini untuk transfer melalui ATM, mobile banking, atau internet banking</p>
                <Button
                  className="w-full bg-primary text-white cursor-pointer"
                  onClick={() => {
                    navigator.clipboard.writeText(payment.va_number);
                    alert("Nomor VA telah disalin!");
                  }}
                >
                  Salin Nomor VA
                </Button>
              </div>
            )}

            {/* Deep Link for E-Wallets */}
            {payment?.deeplink_url && paymentMethod?.type === "E_WALLET" && (
              <div className="space-y-2">
                <p className="text-sm text-gray-400">Pembayaran E-Wallet</p>
                <p className="text-xs text-gray-500">Klik tombol di bawah untuk membuka aplikasi pembayaran dan menyelesaikan transaksi</p>
                <Button
                  className="w-full bg-primary text-white cursor-pointer"
                  onClick={() => {
                    window.open(payment.deeplink_url, "_blank");
                  }}
                >
                  Buka {paymentMethod?.name || "Aplikasi Pembayaran"}
                </Button>
              </div>
            )}

            {/* Redirect URL for Credit Card */}
            {payment?.redirect_url && paymentMethod?.type === "CREDIT_CARD" && (
              <Button
                className="w-full bg-primary text-white cursor-pointer"
                onClick={() => {
                  window.open(payment.redirect_url, "_blank");
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
