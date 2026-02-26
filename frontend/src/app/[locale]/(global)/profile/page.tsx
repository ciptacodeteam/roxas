import type { Metadata } from "next";
import { Suspense } from "react";
import ProfileContent from "@/components/section/profileSection/ProfileContent";

export const metadata: Metadata = {
  title: "Profil Saya",
  description: "Kelola profil, riwayat pesanan, dan pengaturan akun Roxas Games Store Anda.",
  robots: { index: false, follow: false },
};

export default function ProfilePage() {
  return (
    <>
      {/* <HeroProfile /> */}
      <Suspense fallback={<div className="mx-auto max-w-7xl text-white">Loading...</div>}>
        <ProfileContent />
      </Suspense>
    </>
  );
}

