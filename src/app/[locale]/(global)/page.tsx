"use client";

import FavoriteSection from "@/components/section/home/FavoriteSection";
import FlashSaleSection from "@/components/section/home/FlashSaleSection";
import HeroSection from "@/components/section/home/HeroSection";
import InformationSection from "@/components/section/home/InformationSection";
import GameSection from "@/components/section/home/ProductSection/GameSection";


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
