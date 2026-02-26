import type { Metadata } from "next";
import TransactionClient from "./TransactionClient";

export const metadata: Metadata = {
  title: "Cek Status Pesanan",
  description:
    "Cek status pesanan Anda di Roxas Games Store menggunakan nomor invoice. Tidak perlu login.",
  openGraph: {
    title: "Cek Status Pesanan | Roxas Games Store",
    description:
      "Masukkan nomor invoice untuk melihat status transaksi Anda secara instan.",
    type: "website",
  },
};

export default TransactionClient;
