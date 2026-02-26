import type { Metadata } from "next";
import HeroLeaderboard from "@/components/section/leaderboardSection/LeaderboardHeroSection";
import TopLeaderboardPage from "@/components/section/leaderboardSection/TopLeaderboardSection";

export const metadata: Metadata = {
  title: "Leaderboard – Top 10 Pembeli Terbanyak",
  description:
    "Lihat daftar top 10 pembeli terbanyak di Roxas Games Store hari ini, minggu ini, dan bulan ini. Jadilah yang terdepan!",
  openGraph: {
    title: "Leaderboard – Top 10 Pembeli Terbanyak | Roxas Games Store",
    description:
      "Lihat daftar top 10 pembeli terbanyak di Roxas Games Store hari ini, minggu ini, dan bulan ini.",
    type: "website",
  },
};

export default function leaderboardPage() {
  return (
    <>
      <HeroLeaderboard />
      <TopLeaderboardPage />
    </>
  );
}
