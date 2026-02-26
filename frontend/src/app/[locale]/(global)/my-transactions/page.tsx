import type { Metadata } from "next";
import UserTransactionHero from "@/components/section/transactionSection/UserTransactionHero";
import UserTransactionTable from "@/components/section/transactionSection/UserTransactionTableNew";

export const metadata: Metadata = {
  title: "Riwayat Transaksi Saya",
  description: "Lihat semua riwayat transaksi dan pesanan Anda di Roxas Games Store.",
  robots: { index: false, follow: false },
};

export default function MyTransactions() {
  return (
    <>
      <UserTransactionHero />
      <UserTransactionTable />
    </>
  );
}

