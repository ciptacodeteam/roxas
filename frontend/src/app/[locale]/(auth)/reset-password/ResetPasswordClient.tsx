"use client";

import img4 from "public/img/img-4.webp";
import logo from "public/img/logo.webp";

import { useState, useEffect } from "react";
import { Eye, EyeOff } from "lucide-react";
import Image from "next/image";
import { Input } from "@/components/ui/input";
import { Label } from "@radix-ui/react-label";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Lock } from "lucide-react";

// ⚡ Validation Schema
const ResetPasswordSchema = z
  .object({
    password: z.string().min(8, "Kata sandi minimal 8 karakter"),
    confirmPassword: z.string().min(8, "Konfirmasi kata sandi minimal 8 karakter"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Kata sandi tidak cocok",
    path: ["confirmPassword"],
  });

export default function ResetPasswordPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isValidating, setIsValidating] = useState(true);
  const [isValidToken, setIsValidToken] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const locale = pathname?.split("/")[1] || "id";

  const token = searchParams?.get("token");
  const email = searchParams?.get("email");

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<z.infer<typeof ResetPasswordSchema>>({
    resolver: zodResolver(ResetPasswordSchema),
  });

  // Validate token on mount
  useEffect(() => {
    const validateToken = async () => {
      if (!token || !email) {
        setIsValidating(false);
        setIsValidToken(false);
        toast.error("Link Tidak Valid", {
          description: "Link reset password tidak valid atau tidak lengkap.",
        });
        return;
      }

      try {
        const response = await fetch(
          `/api/auth/validate-reset-token?token=${token}&email=${encodeURIComponent(email)}`
        );
        const result = await response.json();

        if (response.ok && result.success) {
          setIsValidToken(true);
        } else {
          setIsValidToken(false);
          toast.error("Link Tidak Valid", {
            description: result.message || "Link reset password tidak valid atau sudah kedaluwarsa.",
          });
        }
      } catch (error) {
        console.error("Token validation error:", error);
        setIsValidToken(false);
        toast.error("Error", {
          description: "Terjadi kesalahan saat memvalidasi link.",
        });
      } finally {
        setIsValidating(false);
      }
    };

    validateToken();
  }, [token, email]);

  const onSubmit = async (data: z.infer<typeof ResetPasswordSchema>) => {
    if (!token || !email) {
      toast.error("Error", {
        description: "Token atau email tidak ditemukan.",
      });
      return;
    }

    setIsSubmitting(true);

    const loadingToast = toast.loading("Mengatur ulang kata sandi...", {
      description: "Mohon tunggu sebentar...",
    });

    try {
      const response = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          token,
          email,
          password: data.password,
        }),
      });

      const result = await response.json();

      // Dismiss loading toast
      toast.dismiss(loadingToast);

      if (response.ok && result.success) {
        toast.success("Kata Sandi Berhasil Diubah", {
          description: "Kata sandi Anda telah berhasil diubah. Silakan login dengan kata sandi baru.",
        });
        // Redirect to login after 2 seconds
        setTimeout(() => {
          router.push(`/${locale}/login`);
        }, 2000);
      } else {
        toast.error("Gagal Mengubah Kata Sandi", {
          description: result.message || "Terjadi kesalahan. Silakan coba lagi.",
        });
      }
    } catch (error) {
      console.error("Reset password error:", error);
      // Dismiss loading toast
      toast.dismiss(loadingToast);
      toast.error("Gagal Mengubah Kata Sandi", {
        description: "Terjadi kesalahan. Silakan coba lagi.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isValidating) {
    return (
      <div className="relative min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 overflow-hidden">
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
        <div className="relative z-10 text-center">
          <div className="text-white text-lg">Memvalidasi link...</div>
        </div>
      </div>
    );
  }

  if (!isValidToken) {
    return (
      <div className="relative min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 overflow-hidden">
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
        <div className="relative z-10 w-full max-w-md px-4 py-8">
          <div className="bg-gray-800/90 backdrop-blur-sm rounded-2xl shadow-2xl border border-gray-700/50 p-8 text-center">
            <h1 className="text-2xl font-bold text-white mb-4">Link Tidak Valid</h1>
            <p className="text-gray-400 mb-6">
              Link reset password tidak valid atau sudah kedaluwarsa. Silakan request link baru.
            </p>
            <Link href={`/${locale}/forgot-password`}>
              <Button className="bg-gradient-to-r from-rose-500 to-rose-600 hover:from-rose-600 hover:to-rose-700 text-white">
                Request Link Baru
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

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
            Reset Kata Sandi
          </h1>
          <p className="text-gray-400 text-center text-sm mb-6">
            Masukkan kata sandi baru untuk akun Anda
          </p>

          {/* Form */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {/* Password Input */}
            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-medium text-gray-300">
                Kata Sandi Baru
              </Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Minimal 8 karakter"
                  className="pl-10 pr-10 bg-gray-700/50 border-gray-600 text-white placeholder:text-gray-500 focus:border-rose-500 focus:ring-rose-500"
                  {...register("password")}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-300"
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
                </button>
              </div>
              {errors.password && (
                <p className="text-sm text-red-400">{errors.password.message}</p>
              )}
            </div>

            {/* Confirm Password Input */}
            <div className="space-y-2">
              <Label htmlFor="confirmPassword" className="text-sm font-medium text-gray-300">
                Konfirmasi Kata Sandi
              </Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="Ulangi kata sandi baru"
                  className="pl-10 pr-10 bg-gray-700/50 border-gray-600 text-white placeholder:text-gray-500 focus:border-rose-500 focus:ring-rose-500"
                  {...register("confirmPassword")}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-300"
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
                </button>
              </div>
              {errors.confirmPassword && (
                <p className="text-sm text-red-400">{errors.confirmPassword.message}</p>
              )}
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-gradient-to-r from-rose-500 to-rose-600 hover:from-rose-600 hover:to-rose-700 text-white font-semibold py-6 rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? "Mengatur Ulang..." : "Reset Kata Sandi"}
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

