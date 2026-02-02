"use client";

import { useEffect } from "react";
import { useAuth } from "@/lib/auth";
import { toast } from "sonner";
import FavoriteSection from "@/components/section/homeSection/FavoriteSection";
import FlashSaleSection from "@/components/section/homeSection/FlashSaleSection";
import HeroSection from "@/components/section/homeSection/HeroSection";
import InformationSection from "@/components/section/homeSection/InformationSection";
import GameSection from "@/components/section/homeSection/ProductSection/GameSection";


export default function IndexPage() {
  const { session, isAdmin } = useAuth();

  useEffect(() => {
    // Show email verification reminder if user is logged in but email not verified
    // Skip for admin users (they are auto-verified)
    if (session?.user && !session.user.email_verified && !isAdmin) {
      // Use a persistent toast that doesn't auto-dismiss
      toast.warning("Email Belum Diverifikasi", {
        description: "Silakan verifikasi email Anda untuk keamanan akun. Cek profil Anda untuk mengirim ulang link verifikasi.",
        duration: Infinity, // Don't auto-dismiss
        id: "email-verification-toast", // Prevent duplicates
      });
    } else {
      // Dismiss the toast if email is verified
      toast.dismiss("email-verification-toast");
    }
  }, [session, isAdmin]);

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
