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
import { Copy, Package, CreditCard, Calendar, CheckCircle2, XCircle, Clock } from "lucide-react";

// ==================== CONSTANTS ====================

const CARD_STYLES = "rounded-xl border border-white/10 bg-gradient-to-br from-white/5 to-white/[0.02] p-6 backdrop-blur-sm";
const SECTION_STYLES = "rounded-lg border border-white/10 bg-white/[0.02] p-4";
const CARD_HEADER_STYLES = "flex items-center gap-3 border-b border-white/10 pb-4";

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
            <div className="flex items-start justify-between">
                <div className="flex-1">
                    <p className="text-sm text-white/60">Status Pesanan</p>
                    <div className="mt-2 flex items-center gap-3">
                        <span className="text-3xl">{statusInfo.icon}</span>
                        <div>
                            <h3 className="text-xl font-semibold text-white">{statusInfo.label}</h3>
                            <p className="text-sm text-white/50">{statusInfo.description}</p>
                        </div>
                    </div>
                </div>
                <div className={`rounded-lg border px-3 py-1.5 text-sm font-medium ${statusInfo.color}`}>
                    {order.status}
                </div>
            </div>

            {/* Timeline */}
            <div className="mt-6 space-y-3 border-t border-white/10 pt-6">
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
            <CardHeader icon={Package} iconColor="purple" title="Informasi Pesanan" />

            <div className="mt-6 space-y-4">
                <InfoRow label="Nomor Pesanan" value={order.order_number} copyable onCopy={() => handleCopy(order.order_number, "Nomor pesanan")} />
                <InfoRow label="Produk" value={order.product_item_name} />
                <InfoRow label="Email" value={order.user_email} />

                {/* Customer Data */}
                {order.customer_data && (
                    <div className={SECTION_STYLES}>
                        <p className="mb-3 text-sm font-medium text-white/70">Data Customer</p>
                        <div className="space-y-2">
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

            <div className="mt-6 space-y-4">
                <InfoRow label="Metode Pembayaran" value={order.payment_method_name} />

                {/* Payment Details */}
                {order.payment && (
                    <div className="space-y-3">
                        {order.payment.va_number && (
                            <div className={SECTION_STYLES}>
                                <p className="mb-2 text-sm font-medium text-white/70">Nomor Virtual Account</p>
                                <div className="flex items-center gap-2">
                                    <code className="flex-1 rounded bg-black/30 px-3 py-2 font-mono text-lg text-white">
                                        {order.payment.va_number}
                                    </code>
                                    <button
                                        onClick={() => handleCopy(order.payment!.va_number!, "Nomor VA")}
                                        className="rounded-lg bg-white/10 p-2 text-white/70 transition-colors hover:bg-white/20 hover:text-white"
                                    >
                                        <Copy className="h-4 w-4" />
                                    </button>
                                </div>
                            </div>
                        )}

                        {order.payment.qris_string && (
                            <div className={SECTION_STYLES}>
                                <p className="mb-2 text-sm font-medium text-white/70">QRIS</p>
                                <p className="text-sm text-white/60">Scan kode QR untuk pembayaran</p>
                            </div>
                        )}

                        <div className={`rounded-lg border px-3 py-2 ${getPaymentStatusInfo(order.payment.status).color}`}>
                            <p className="text-sm font-medium">
                                Status: {getPaymentStatusInfo(order.payment.status).label}
                            </p>
                        </div>
                    </div>
                )}

                {/* Price Breakdown */}
                <div className={SECTION_STYLES}>
                    <p className="mb-3 text-sm font-medium text-white/70">Rincian Harga</p>
                    <div className="space-y-2">
                        <PriceRow label="Harga Produk" amount={order.original_price} />
                        {order.final_price !== order.original_price && (
                            <PriceRow label="Harga Setelah Diskon" amount={order.final_price} highlight />
                        )}
                        {order.payment_fee > 0 && <PriceRow label="Biaya Pembayaran" amount={order.payment_fee} />}
                        {order.vat_amount > 0 && <PriceRow label="PPN" amount={order.vat_amount} />}
                        <div className="border-t border-white/10 pt-2">
                            <PriceRow label="Total" amount={order.total_amount} total />
                        </div>
                    </div>
                </div>

                {order.refund_amount && (
                    <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-4">
                        <p className="mb-2 text-sm font-medium text-red-400">Dana Dikembalikan</p>
                        <p className="text-2xl font-bold text-white">{formatCurrency(order.refund_amount)}</p>
                        {order.refund_reason && <p className="mt-1 text-sm text-white/60">{order.refund_reason}</p>}
                    </div>
                )}
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
            <div className={`rounded-lg p-2 ${active ? "bg-blue-500/20 text-blue-400" : "bg-white/5 text-white/40"}`}>
                {icon}
            </div>
            <div className="flex-1">
                <p className="text-sm font-medium text-white">{label}</p>
                <p className="text-sm text-white/60">{value}</p>
                {sublabel && <p className="text-xs text-white/40">{sublabel}</p>}
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
        <div className="flex items-center justify-between gap-4">
            <span className="text-sm text-white/60">{label}</span>
            <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-white">{value}</span>
                {copyable && onCopy && (
                    <button
                        onClick={onCopy}
                        className="rounded p-1 text-white/40 transition-colors hover:bg-white/10 hover:text-white"
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
    iconColor: "purple" | "green";
    title: string;
}) {
    const colorClasses = {
        purple: "bg-purple-500/20 text-purple-400",
        green: "bg-green-500/20 text-green-400",
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
