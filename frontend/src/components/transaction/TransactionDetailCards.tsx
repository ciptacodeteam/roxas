/**
 * Transaction Detail Components
 * Modular components for displaying transaction information
 */

"use client";

import { type OrderDetail } from "@/lib/transaction/types";
import {
    getOrderStatusInfo,
    getPaymentStatusInfo,
    formatCurrency,
    formatDate,
    getRelativeTime,
    copyToClipboard,
} from "@/lib/transaction/utils";
import { toast } from "sonner";
import { Copy, Package, CreditCard, Calendar, CheckCircle2, XCircle, Clock, Zap } from "lucide-react";

// ==================== CONSTANTS ====================

const CARD_STYLES = "rounded-2xl bg-slate-800/70 backdrop-blur-sm p-6 border border-white/10";
const SECTION_STYLES = "rounded-xl bg-slate-900/50 p-4 border border-white/5";
const CARD_HEADER_STYLES = "flex items-center gap-3 border-b border-white/10 pb-4 mb-6";

// ==================== HOOKS ====================

/**
 * Custom hook for copy to clipboard functionality
 */
function useCopyToClipboard() {
    return async (text: string, label: string) => {
        const success = await copyToClipboard(text);
        if (success) {
            toast.success(`${label} disalin ke clipboard`);
        } else {
            toast.error("Gagal menyalin");
        }
    };
}

// ==================== COMPONENTS ====================

/**
 * Transaction Status Card
 */
export function TransactionStatusCard({ order }: { order: OrderDetail }) {
    const statusInfo = getOrderStatusInfo(order.status);

    return (
        <div className={CARD_STYLES}>
            <CardHeader icon={Package} iconColor="purple" title="Status Pesanan" />
            
            <div className="flex items-start justify-between">
                <div className="flex-1">
                    <div className="flex items-center gap-3 mb-4">
                        <span className="text-2xl">{statusInfo.icon}</span>
                        <div>
                            <h3 className="text-lg font-semibold text-white">{statusInfo.label}</h3>
                            <p className="text-sm text-white/60">{statusInfo.description}</p>
                        </div>
                    </div>
                </div>
                <div className={`rounded-lg px-3 py-1.5 text-sm font-medium ${statusInfo.color}`}>
                    {order.status}
                </div>
            </div>

            {/* Timeline */}
            <div className="space-y-3">
                <TimelineItem
                    icon={<Calendar className="h-4 w-4" />}
                    label="Dibuat"
                    value={formatDate(order.created_at)}
                    sublabel={getRelativeTime(order.created_at)}
                    active
                />
                {order.paid_at && (
                    <TimelineItem
                        icon={<CheckCircle2 className="h-4 w-4" />}
                        label="Dibayar"
                        value={formatDate(order.paid_at)}
                        sublabel={getRelativeTime(order.paid_at)}
                        active
                    />
                )}
                {order.completed_at && (
                    <TimelineItem
                        icon={<CheckCircle2 className="h-4 w-4" />}
                        label="Selesai"
                        value={formatDate(order.completed_at)}
                        sublabel={getRelativeTime(order.completed_at)}
                        active
                    />
                )}
                {order.refunded_at && (
                    <TimelineItem
                        icon={<XCircle className="h-4 w-4" />}
                        label="Dikembalikan"
                        value={formatDate(order.refunded_at)}
                        sublabel={order.refund_reason || ""}
                        active
                    />
                )}
                {order.payment_expires_at && order.status === "PENDING" && (
                    <TimelineItem
                        icon={<Clock className="h-4 w-4" />}
                        label="Batas Pembayaran"
                        value={formatDate(order.payment_expires_at)}
                        sublabel={getRelativeTime(order.payment_expires_at)}
                    />
                )}
            </div>
        </div>
    );
}

/**
 * Order Information Card
 */
export function OrderInformationCard({ order }: { order: OrderDetail }) {
    const handleCopy = useCopyToClipboard();

    return (
        <div className={CARD_STYLES}>
            <CardHeader icon={Package} iconColor="purple" title="Detail Pembelian" />

            <div className="space-y-4">
                <InfoRow label="Produk" value={order.product_item_name} />
                <InfoRow label="Nomor Pesanan" value={order.order_number} copyable onCopy={() => handleCopy(order.order_number, "Nomor pesanan")} />
                <InfoRow label="Email" value={order.user_email} />

                {/* Customer Data */}
                {order.customer_data && (
                    <div className={SECTION_STYLES}>
                        <p className="mb-3 text-sm font-medium text-white">Data Customer</p>
                        <div className="space-y-3">
                            {order.customer_data.accountName && (
                                <InfoRow label="Nama Akun" value={order.customer_data.accountName} copyable onCopy={() => handleCopy(order.customer_data.accountName!, "Nama Akun")} />
                            )}
                            {order.customer_data.userId && (
                                <InfoRow label="User ID" value={order.customer_data.userId} copyable onCopy={() => handleCopy(order.customer_data.userId!, "User ID")} />
                            )}
                            {order.customer_data.serverId && (
                                <InfoRow label="Server ID" value={order.customer_data.serverId} copyable onCopy={() => handleCopy(order.customer_data.serverId!, "Server ID")} />
                            )}
                            {order.customer_data.zoneId && (
                                <InfoRow label="Zone ID" value={order.customer_data.zoneId} copyable onCopy={() => handleCopy(order.customer_data.zoneId!, "Zone ID")} />
                            )}
                            {order.customer_data.phoneNumber && (
                                <InfoRow label="Nomor HP" value={order.customer_data.phoneNumber} copyable onCopy={() => handleCopy(order.customer_data.phoneNumber!, "Nomor HP")} />
                            )}
                            {order.customer_data.meterNumber && (
                                <InfoRow label="Nomor Meter" value={order.customer_data.meterNumber} copyable onCopy={() => handleCopy(order.customer_data.meterNumber!, "Nomor Meter")} />
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

/**
 * Payment Information Card
 */
export function PaymentInformationCard({ order }: { order: OrderDetail }) {
    const handleCopy = useCopyToClipboard();

    return (
        <div className={CARD_STYLES}>
            <CardHeader icon={CreditCard} iconColor="green" title="Informasi Pembayaran" />

            <div className="space-y-4">
                <InfoRow label="Metode Pembayaran" value={order.payment_method_name} />

                {/* Payment Details */}
                {order.payment && (
                    <div className="space-y-4">
                        {/* Virtual Account */}
                        {order.payment.va_number && (
                            <div className={SECTION_STYLES}>
                                <p className="mb-3 text-sm font-medium text-white">Nomor Virtual Account</p>
                                {order.payment.payment_method?.name && (
                                    <p className="mb-2 text-xs text-white/60">Bank: {order.payment.payment_method.name}</p>
                                )}
                                <div className="flex items-center gap-2">
                                    <code className="flex-1 rounded-lg bg-slate-950 border border-white/10 px-3 py-2 font-mono text-lg text-white">
                                        {order.payment.va_number}
                                    </code>
                                    <button
                                        onClick={() => handleCopy(order.payment!.va_number!, "Nomor VA")}
                                        className="rounded-lg bg-white/10 p-2 text-white/70 transition-colors hover:bg-white/20 hover:text-white"
                                    >
                                        <Copy className="h-4 w-4" />
                                    </button>
                                </div>
                                <p className="mt-2 text-xs text-white/60">Gunakan nomor ini untuk transfer melalui ATM, mobile banking, atau internet banking</p>
                            </div>
                        )}

                        {/* QRIS */}
                        {(order.payment.qris_string || order.payment.payment_url) && order.payment.payment_method?.type === "QRIS" && (
                            <div className={SECTION_STYLES}>
                                <p className="mb-3 text-sm font-medium text-white">QRIS</p>
                                {(() => {
                                    const qrCodeValue = order.payment.qris_string || order.payment.payment_url;
                                    return (
                                        <>
                                            <div className="flex justify-center rounded-xl bg-white p-4 mb-3">
                                                {qrCodeValue && qrCodeValue.startsWith('http') ? (
                                                    <img
                                                        src={qrCodeValue}
                                                        alt="QRIS QR Code"
                                                        className="w-64 h-64 object-contain"
                                                    />
                                                ) : qrCodeValue ? (
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
                                                ) : (
                                                    <div className="flex items-center justify-center h-[220px] w-[220px] bg-gray-100">
                                                        <p className="text-gray-500 text-sm text-center p-4">
                                                            Memuat QR Code...
                                                        </p>
                                                    </div>
                                                )}
                                            </div>
                                            {qrCodeValue && (
                                                <button
                                                    onClick={() => handleCopy(qrCodeValue, "QRIS code")}
                                                    className="w-full rounded-lg bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700 transition-colors"
                                                >
                                                    {qrCodeValue.startsWith('http') ? "Buka QR Code di Tab Baru" : "Salin QRIS Code"}
                                                </button>
                                            )}
                                        </>
                                    );
                                })()}
                                <p className="text-sm text-white/60 mt-3">Scan kode QR untuk pembayaran</p>
                            </div>
                        )}

                        {/* E-Wallet (ShopeePay, GoPay, etc.) */}
                        {order.payment.deeplink_url && order.payment.payment_method?.type === "E_WALLET" && (
                            <div className={SECTION_STYLES}>
                                <p className="mb-3 text-sm font-medium text-white">Pembayaran {order.payment.payment_method.name}</p>
                                <p className="text-sm text-white/60 mb-3">Pembayaran telah diproses melalui {order.payment.payment_method.name}</p>
                                {order.payment.status === "PENDING" && order.payment.deeplink_url && (
                                    <a
                                        href={order.payment.deeplink_url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-block rounded-lg bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700 transition-colors"
                                    >
                                        Buka {order.payment.payment_method.name}
                                    </a>
                                )}
                            </div>
                        )}

                        {/* Credit Card */}
                        {order.payment.redirect_url && order.payment.payment_method?.type === "CREDIT_CARD" && (
                            <div className={SECTION_STYLES}>
                                <p className="mb-3 text-sm font-medium text-white">Pembayaran Kartu Kredit</p>
                                <p className="text-sm text-white/60">Pembayaran telah diproses</p>
                            </div>
                        )}

                        {/* Payment Status */}
                        <div className={`rounded-lg px-4 py-3 ${getPaymentStatusInfo(order.payment.status).color}`}>
                            <p className="text-sm font-medium mb-1">
                                Status Pembayaran: {getPaymentStatusInfo(order.payment.status).label}
                            </p>
                            {order.payment.paid_at && (
                                <p className="text-xs text-white/60">
                                    Dibayar: {new Date(order.payment.paid_at).toLocaleString("id-ID")}
                                </p>
                            )}
                        </div>
                    </div>
                )}

                {/* Price Breakdown */}
                <div className={SECTION_STYLES}>
                    <p className="mb-4 text-sm font-medium text-white">Rincian Harga</p>
                    <div className="space-y-3">
                        <PriceRow label="Harga Produk" amount={order.original_price} />
                        {order.final_price !== order.original_price && (
                            <PriceRow label="Harga Setelah Diskon" amount={order.final_price} highlight />
                        )}
                        {order.payment_fee > 0 && <PriceRow label="Biaya Pembayaran" amount={order.payment_fee} />}
                        {order.vat_amount > 0 && <PriceRow label="PPN" amount={order.vat_amount} />}
                        <div className="border-t border-white/20 pt-3">
                            <PriceRow label="Total" amount={order.total_amount} total />
                        </div>
                    </div>
                </div>

                {order.refund_amount && (
                    <div className="rounded-xl bg-red-500/10 border border-red-500/30 p-4">
                        <p className="mb-2 text-sm font-medium text-red-400">Dana Dikembalikan</p>
                        <p className="text-xl font-bold text-white">{formatCurrency(order.refund_amount)}</p>
                        {order.refund_reason && <p className="mt-1 text-sm text-white/60">{order.refund_reason}</p>}
                    </div>
                )}
            </div>
        </div>
    );
}

/**
 * Digiflazz Transaction Status Card
 */
export function DigiflazzTransactionCard({ order }: { order: OrderDetail }) {
    const handleCopy = useCopyToClipboard();

    if (!order.digiflazz_transaction) {
        return null;
    }

    const df = order.digiflazz_transaction;
    
    // Get status info
    const getDigiflazzStatusInfo = (status: string) => {
        switch (status) {
            case "Sukses":
                return {
                    label: "Berhasil",
                    color: "bg-green-500/10 text-green-400 border-green-500/30",
                    icon: "✅",
                    description: "Top-up berhasil diproses"
                };
            case "Pending":
                return {
                    label: "Sedang Diproses",
                    color: "bg-yellow-500/10 text-yellow-400 border-yellow-500/30", 
                    icon: "⏳",
                    description: "Sedang diproses oleh provider"
                };
            case "Gagal":
                return {
                    label: "Gagal",
                    color: "bg-red-500/10 text-red-400 border-red-500/30",
                    icon: "❌",
                    description: "Top-up gagal diproses"
                };
            default:
                return {
                    label: status,
                    color: "bg-gray-500/10 text-gray-400 border-gray-500/30",
                    icon: "ℹ️",
                    description: "Status tidak dikenal"
                };
        }
    };

    const statusInfo = getDigiflazzStatusInfo(df.status);

    return (
        <div className={CARD_STYLES}>
            <CardHeader icon={Zap} iconColor="orange" title="Status Top-up Digiflazz" />
            
            <div className="space-y-4">
                {/* Status Display */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <span className="text-2xl">{statusInfo.icon}</span>
                        <div>
                            <h3 className="text-lg font-semibold text-white">{statusInfo.label}</h3>
                            <p className="text-sm text-white/60">{statusInfo.description}</p>
                        </div>
                    </div>
                    <div className={`rounded-lg border px-3 py-1.5 text-sm font-medium ${statusInfo.color}`}>
                        {df.status}
                    </div>
                </div>

                {/* Transaction Details */}
                <div className={SECTION_STYLES}>
                    <p className="mb-3 text-sm font-medium text-white">Detail Transaksi</p>
                    <div className="space-y-3">
                        <InfoRow 
                            label="Reference ID" 
                            value={df.ref_id} 
                            copyable 
                            onCopy={() => handleCopy(df.ref_id, "Reference ID")} 
                        />
                        {df.trx_id && (
                            <InfoRow 
                                label="Transaction ID" 
                                value={df.trx_id}
                                copyable 
                                onCopy={() => handleCopy(df.trx_id, "Transaction ID")} 
                            />
                        )}
                        <InfoRow label="SKU Code" value={df.sku_code} />
                        <InfoRow label="Customer No" value={df.customer_no} />
                        {df.message && (
                            <InfoRow label="Message" value={df.message} />
                        )}
                    </div>
                </div>

                {/* Serial Number (voucher codes, etc.) */}
                {df.serial_number && (
                    <div className={`${SECTION_STYLES} bg-green-500/5 border-green-500/20`}>
                        <p className="mb-3 text-sm font-medium text-green-400">Serial Number / Voucher</p>
                        <div className="flex items-center gap-2">
                            <code className="flex-1 rounded-lg bg-slate-950 border border-green-500/30 px-3 py-2 font-mono text-lg text-green-400">
                                {df.serial_number}
                            </code>
                            <button
                                onClick={() => handleCopy(df.serial_number, "Serial number")}
                                className="rounded-lg bg-green-500/20 p-2 text-green-400 transition-colors hover:bg-green-500/30"
                            >
                                <Copy className="h-4 w-4" />
                            </button>
                        </div>
                        <p className="mt-2 text-xs text-green-400/70">Simpan serial number ini untuk aktivasi produk</p>
                    </div>
                )}

                {/* Timeline */}
                <div className="space-y-3">
                    <TimelineItem
                        icon={<Calendar className="h-4 w-4" />}
                        label="Dibuat"
                        value={formatDate(df.created_at)}
                        sublabel={getRelativeTime(df.created_at)}
                        active
                    />
                    {df.updated_at !== df.created_at && (
                        <TimelineItem
                            icon={<CheckCircle2 className="h-4 w-4" />}
                            label="Diperbarui"
                            value={formatDate(df.updated_at)}
                            sublabel={getRelativeTime(df.updated_at)}
                            active
                        />
                    )}
                </div>
            </div>
        </div>
    );
}

// ==================== UTILITY COMPONENTS ====================

/**
 * Timeline Item Component
 */
function TimelineItem({
    icon,
    label,
    value,
    sublabel,
    active = false,
}: {
    icon: React.ReactNode;
    label: string;
    value: string;
    sublabel?: string;
    active?: boolean;
}) {
    return (
        <div className="flex items-start gap-3">
            <div className={`rounded-lg p-2 ${active ? "bg-blue-500/20 text-blue-400 border border-blue-500/30" : "bg-white/5 text-white/40 border border-white/10"}`}>
                {icon}
            </div>
            <div className="flex-1">
                <p className="text-sm font-medium text-white">{label}</p>
                <p className="text-sm text-white/70">{value}</p>
                {sublabel && <p className="text-xs text-white/50">{sublabel}</p>}
            </div>
        </div>
    );
}

/**
 * Info Row Component
 */
function InfoRow({
    label,
    value,
    copyable = false,
    onCopy,
}: {
    label: string;
    value: string;
    copyable?: boolean;
    onCopy?: () => void;
}) {
    return (
        <div className="flex items-center justify-between gap-4 py-2">
            <span className="text-sm text-white/70">{label}</span>
            <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-white">{value}</span>
                {copyable && onCopy && (
                    <button
                        onClick={onCopy}
                        className="rounded-lg p-1.5 text-white/50 transition-colors hover:bg-white/10 hover:text-white"
                    >
                        <Copy className="h-3.5 w-3.5" />
                    </button>
                )}
            </div>
        </div>
    );
}

/**
 * Price Row Component
 */
function PriceRow({
    label,
    amount,
    highlight = false,
    total = false,
}: {
    label: string;
    amount: number;
    highlight?: boolean;
    total?: boolean;
}) {
    return (
        <div className="flex items-center justify-between gap-4">
            <span className={`text-sm ${total ? "font-semibold text-white" : "text-white/60"}`}>{label}</span>
            <span
                className={`text-sm font-medium ${total ? "text-lg text-white" : highlight ? "text-green-400" : "text-white"
                    }`}
            >
                {formatCurrency(amount)}
            </span>
        </div>
    );
}

/**
 * Card Header Component
 */
function CardHeader({
    icon: Icon,
    iconColor,
    title,
}: {
    icon: React.ComponentType<{ className?: string }>;
    iconColor: "purple" | "green" | "orange";
    title: string;
}) {
    const colorClasses = {
        purple: "bg-purple-500/20 text-purple-400 border border-purple-500/30",
        green: "bg-green-500/20 text-green-400 border border-green-500/30",
        orange: "bg-orange-500/20 text-orange-400 border border-orange-500/30",
    };

    return (
        <div className={CARD_HEADER_STYLES}>
            <div className={`rounded-lg p-2.5 ${colorClasses[iconColor]}`}>
                <Icon className="h-5 w-5" />
            </div>
            <h2 className="text-lg font-semibold text-white">{title}</h2>
        </div>
    );
}
