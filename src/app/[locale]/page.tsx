"use client";

import FavoriteSection from "@/components/section/home/FavoriteSection";
import FlashSaleSection from "@/components/section/home/FlashSaleSection";
import HeroSection from "@/components/section/home/HeroSection";


export default function IndexPage() {
  return (
    <>
      <HeroSection />
      <FlashSaleSection />
      <FavoriteSection />
    </>
  );
}
