/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import img4 from "public/img/img-4.webp";
import logo from "public/img/logo.webp";

import { useState } from "react";
import Image from "next/image";
import { Input } from "@/components/ui/input";
import { Label } from "@radix-ui/react-label";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { usePathname, useRouter } from "next/navigation";
import { toast } from "sonner";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Mail } from "lucide-react";

// ⚡ Validation Schema
const ForgotPasswordSchema = z.object({
  email: z.string().email("Email tidak valid"),
});

export default function ForgotPasswordPage() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const locale = pathname?.split("/")[1] || "id";

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<z.infer<typeof ForgotPasswordSchema>>({
    resolver: zodResolver(ForgotPasswordSchema),
  });

  const onSubmit = async (data: z.infer<typeof ForgotPasswordSchema>) => {
    setIsSubmitting(true);

    const loadingToast = toast.loading("Mengirim email reset password...", {
      description: "Mohon tunggu sebentar...",
    });

    try {
      const response = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email: data.email }),
      });

      const result = await response.json();

      // Dismiss loading toast
      toast.dismiss(loadingToast);

      if (response.ok && result.success) {
        toast.success("Email Terkirim", {
          description: "Silakan cek inbox email Anda untuk reset password. Link berlaku selama 1 jam.",
        });
        // Redirect to login after 2 seconds
        setTimeout(() => {
          router.push(`/${locale}/login`);
        }, 2000);
      } else {
        toast.error("Gagal Mengirim Email", {
          description: result.message || "Terjadi kesalahan. Silakan coba lagi.",
        });
      }
    } catch (error) {
      console.error("Forgot password error:", error);
      // Dismiss loading toast
      toast.dismiss(loadingToast);
      toast.error("Gagal Mengirim Email", {
        description: "Terjadi kesalahan. Silakan coba lagi.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 overflow-hidden">
      {/* Background Image with Overlay */}
      <div className="absolute inset-0 z-0">
        <Image
          src={img4}
          alt="Background"
          fill
          className="object-cover opacity-20"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-br from-black/60 via-black/40 to-black/60" />
      </div>

      {/* Content */}
      <div className="relative z-10 w-full max-w-md px-4 py-8">
        <div className="bg-gray-800/90 backdrop-blur-sm rounded-2xl shadow-2xl border border-gray-700/50 p-8">
          {/* Logo */}
          <div className="flex justify-center mb-6">
            <Link href={`/${locale}`}>
              <Image
                src={logo}
                alt="Roxas Store Logo"
                width={120}
                height={120}
                className="object-contain"
                priority
              />
            </Link>
          </div>

          {/* Title */}
          <h1 className="text-2xl font-bold text-white text-center mb-2">
            Lupa Kata Sandi?
          </h1>
          <p className="text-gray-400 text-center text-sm mb-6">
            Masukkan email Anda dan kami akan mengirimkan link untuk reset password
          </p>

          {/* Form */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {/* Email Input */}
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium text-gray-300">
                Email
              </Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <Input
                  id="email"
                  type="email"
                  placeholder="nama@email.com"
                  className="pl-10 bg-gray-700/50 border-gray-600 text-white placeholder:text-gray-500 focus:border-rose-500 focus:ring-rose-500"
                  {...register("email")}
                />
              </div>
              {errors.email && (
                <p className="text-sm text-red-400">{errors.email.message}</p>
              )}
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-gradient-to-r from-rose-500 to-rose-600 hover:from-rose-600 hover:to-rose-700 text-white font-semibold py-6 rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? "Mengirim..." : "Kirim Link Reset Password"}
            </Button>
          </form>

          {/* Back to Login */}
          <div className="mt-6 text-center">
            <Link
              href={`/${locale}/login`}
              className="text-sm text-rose-400 hover:text-rose-300 transition-colors"
            >
              ← Kembali ke Login
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

