/**
 * Transaction Detail Route
 * Dynamic route for individual transaction details
 */

import type { Metadata } from "next";
import TransactionDetailPage from "@/components/transaction/TransactionDetailPage";

export const metadata: Metadata = {
  title: "Detail Transaksi",
  description: "Detail pesanan dan status transaksi Anda di Roxas Games Store.",
  robots: { index: false, follow: false },
};

export default function TransactionDetailRoute() {
  return <TransactionDetailPage />;
}
