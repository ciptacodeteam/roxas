import type { Metadata } from "next";
import WinRateClient from "./WinRateClient";

export const metadata: Metadata = {
  title: "Kalkulator Win Rate Mobile Legends",
  description:
    "Hitung berapa kemenangan yang dibutuhkan untuk mencapai win rate target kamu di Mobile Legends. Gratis & mudah.",
  openGraph: {
    title: "Kalkulator Win Rate | Roxas Games Store",
    description:
      "Hitung kebutuhan menang untuk target win rate ML kamu. Gratis & mudah.",
    type: "website",
  },
};

export default WinRateClient;
