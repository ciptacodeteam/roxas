import type { OrderStatus, PaymentStatus, OrderStatusInfo, PaymentStatusInfo } from "./types";

/**
 * Get order status information with label, color, and icon
 */
export function getOrderStatusInfo(status: OrderStatus): OrderStatusInfo {
  const statusMap: Record<OrderStatus, OrderStatusInfo> = {
    PENDING: {
      label: "Menunggu Pembayaran",
      color: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
      icon: "⏳",
      description: "Pesanan menunggu pembayaran",
    },
    PAID: {
      label: "Dibayar",
      color: "bg-blue-500/20 text-blue-400 border-blue-500/30",
      icon: "💳",
      description: "Pembayaran berhasil, sedang diproses",
    },
    PROCESSING: {
      label: "Diproses",
      color: "bg-purple-500/20 text-purple-400 border-purple-500/30",
      icon: "⚙️",
      description: "Pesanan sedang diproses",
    },
    COMPLETED: {
      label: "Selesai",
      color: "bg-green-500/20 text-green-400 border-green-500/30",
      icon: "✅",
      description: "Pesanan berhasil diselesaikan",
    },
    FAILED: {
      label: "Gagal",
      color: "bg-red-500/20 text-red-400 border-red-500/30",
      icon: "❌",
      description: "Pesanan gagal diproses",
    },
    REFUNDED: {
      label: "Dikembalikan",
      color: "bg-gray-500/20 text-gray-400 border-gray-500/30",
      icon: "↩️",
      description: "Dana telah dikembalikan",
    },
    EXPIRED: {
      label: "Kadaluarsa",
      color: "bg-orange-500/20 text-orange-400 border-orange-500/30",
      icon: "⌛",
      description: "Pembayaran kadaluarsa",
    },
  };

  return statusMap[status] || statusMap.PENDING;
}

/**
 * Get payment status information
 */
export function getPaymentStatusInfo(status: PaymentStatus): PaymentStatusInfo {
  const statusMap: Record<PaymentStatus, PaymentStatusInfo> = {
    PENDING: {
      label: "Menunggu Pembayaran",
      color: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
      icon: "⏳",
    },
    SUCCESS: {
      label: "Berhasil",
      color: "bg-green-500/20 text-green-400 border-green-500/30",
      icon: "✅",
    },
    FAILED: {
      label: "Gagal",
      color: "bg-red-500/20 text-red-400 border-red-500/30",
      icon: "❌",
    },
    EXPIRED: {
      label: "Kadaluarsa",
      color: "bg-orange-500/20 text-orange-400 border-orange-500/30",
      icon: "⌛",
    },
    REFUNDED: {
      label: "Dikembalikan",
      color: "bg-gray-500/20 text-gray-400 border-gray-500/30",
      icon: "↩️",
    },
  };

  return statusMap[status] || statusMap.PENDING;
}

/**
 * Get status badge color classes based on order status
 * @deprecated Use getOrderStatusInfo instead
 */
export function getStatusColor(status: OrderStatus): string {
  switch (status) {
    case "COMPLETED":
      return "bg-green-600/20 text-green-400";
    case "PAID":
    case "PROCESSING":
      return "bg-blue-600/20 text-blue-400";
    case "PENDING":
      return "bg-yellow-600/20 text-yellow-400";
    case "FAILED":
      return "bg-red-600/20 text-red-400";
    case "REFUNDED":
      return "bg-purple-600/20 text-purple-400";
    case "EXPIRED":
      return "bg-gray-600/20 text-gray-400";
    default:
      return "bg-gray-600/20 text-gray-400";
  }
}

/**
 * Get localized status label
 * @deprecated Use getOrderStatusInfo instead
 */
export function getStatusLabel(status: OrderStatus): string {
  switch (status) {
    case "PENDING":
      return "Menunggu Pembayaran";
    case "PAID":
      return "Dibayar";
    case "PROCESSING":
      return "Diproses";
    case "COMPLETED":
      return "Selesai";
    case "FAILED":
      return "Gagal";
    case "REFUNDED":
      return "Dikembalikan";
    case "EXPIRED":
      return "Kedaluwarsa";
    default:
      return status;
  }
}

/**
 * Format currency to Indonesian Rupiah
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

/**
 * Format date to Indonesian locale with full format
 */
export function formatDate(dateString: string): string {
  return new Intl.DateTimeFormat("id-ID", {
    dateStyle: "long",
    timeStyle: "short",
  }).format(new Date(dateString));
}

/**
 * Get relative time (e.g., "2 hours ago")
 */
export function getRelativeTime(date: string): string {
  const now = new Date();
  const past = new Date(date);
  const diffMs = now.getTime() - past.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return "Baru saja";
  if (diffMins < 60) return `${diffMins} menit yang lalu`;
  if (diffHours < 24) return `${diffHours} jam yang lalu`;
  if (diffDays < 7) return `${diffDays} hari yang lalu`;
  
  return formatDate(date);
}

/**
 * Copy text to clipboard
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (error) {
    console.error("Failed to copy:", error);
    return false;
  }
}
