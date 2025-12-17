"use client";

import FavoriteSection from "@/components/section/homeSection/FavoriteSection";
import FlashSaleSection from "@/components/section/homeSection/FlashSaleSection";
import HeroSection from "@/components/section/homeSection/HeroSection";
import InformationSection from "@/components/section/homeSection/InformationSection";
import GameSection from "@/components/section/homeSection/ProductSection/GameSection";


export default function IndexPage() {
  return (
    <>
      <HeroSection />
      <FlashSaleSection />
      <FavoriteSection />
      <GameSection />
      <InformationSection />
    </>
  );
}
