"use client";

import { useEffect } from "react";
import { useAuth } from "@/lib/auth";
import { toast } from "sonner";

/**
 * Renders nothing — shows/hides a persistent toast reminding the user
 * to verify their email address if they are logged-in but unverified.
 */
export default function HomeVerificationToast() {
  const { session, isAdmin } = useAuth();

  useEffect(() => {
    if (session?.user && !session.user.email_verified && !isAdmin) {
      toast.warning("Email Belum Diverifikasi", {
        description:
          "Silakan verifikasi email Anda untuk keamanan akun. Cek profil Anda untuk mengirim ulang link verifikasi.",
        duration: Infinity,
        id: "email-verification-toast",
      });
    } else {
      toast.dismiss("email-verification-toast");
    }
  }, [session, isAdmin]);

  return null;
}
