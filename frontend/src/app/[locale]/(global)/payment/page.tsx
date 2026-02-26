import type { Metadata } from "next";
import PaymentClient from "./PaymentClient";

export const metadata: Metadata = {
  title: "Pembayaran Pesanan",
  description: "Selesaikan pembayaran pesanan top up game Anda di Roxas Games Store.",
  robots: { index: false, follow: false },
};

export default PaymentClient;
