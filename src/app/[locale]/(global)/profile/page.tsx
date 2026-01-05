import { Suspense } from "react";
import ProfileContent from "@/components/section/profileSection/ProfileContent";

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

