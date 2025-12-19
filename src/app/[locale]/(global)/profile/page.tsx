import { Suspense } from "react";
import HeroProfile from "@/components/section/profileSection/HeroSection";
import ProfileContent from "@/components/section/profileSection/ProfileContent";

export default function ProfilePage() {
  return (
    <>
      <HeroProfile />
      <Suspense fallback={<div className="mx-auto max-w-7xl p-8 text-white">Loading...</div>}>
        <ProfileContent />
      </Suspense>
    </>
  );
}

