import type { Metadata } from "next";
import FavoriteSection from "@/components/section/homeSection/FavoriteSection";
import FlashSaleSection from "@/components/section/homeSection/FlashSaleSection";
import HeroSection from "@/components/section/homeSection/HeroSection";
import InformationSection from "@/components/section/homeSection/InformationSection";
import GameSection from "@/components/section/homeSection/ProductSection/GameSection";
import HomeVerificationToast from "./HomeVerificationToast";

export const metadata: Metadata = {
  title: "Top Up Game Teraman & Terpercaya",
  description:
    "Top up Mobile Legends, Free Fire, PUBG, dan ratusan game lainnya di Roxas Games Store. Proses instan, harga murah, pembayaran lengkap, 100% aman.",
  openGraph: {
    title: "Roxas Games Store | Top Up Game Teraman & Terpercaya",
    description:
      "Top up Mobile Legends, Free Fire, PUBG, dan ratusan game lainnya. Proses instan, harga murah, 100% aman.",
    type: "website",
  },
};

export default function IndexPage() {
  return (
    <>
      <HomeVerificationToast />
      <HeroSection />
      <FlashSaleSection />
      {/* <FavoriteSection /> */}
      <GameSection />
      <InformationSection />
    </>
  );
}

