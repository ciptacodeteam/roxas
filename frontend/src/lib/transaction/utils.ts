import type { OrderStatus } from "./api";

/**
 * Get status badge color classes based on order status
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
 * Format date to Indonesian locale
 */
export function formatDate(dateString: string): string {
  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(dateString));
}
