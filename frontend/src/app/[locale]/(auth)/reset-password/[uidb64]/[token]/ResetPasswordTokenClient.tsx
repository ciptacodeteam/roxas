"use client";

import logo from "public/img/logo1.webp";
import img4 from "public/img/img-4.webp";

import { useState } from "react";
import { useRouter, usePathname, useParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Eye, EyeOff, Lock, CheckCircle, Loader2 } from "lucide-react";

import Image from "next/image";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { Label } from "@radix-ui/react-label";
import { Button } from "@/components/ui/button";
import { useResetPasswordConfirm } from "@/lib/password-reset";

// Validation Schema
const ResetPasswordSchema = z
  .object({
    new_password: z
      .string()
      .min(8, "Password minimal 8 karakter")
      .regex(/[A-Z]/, "Password harus mengandung huruf besar")
      .regex(/[a-z]/, "Password harus mengandung huruf kecil")
      .regex(/[0-9]/, "Password harus mengandung angka"),
    confirm_password: z.string(),
  })
  .refine((data) => data.new_password === data.confirm_password, {
    message: "Password tidak cocok",
    path: ["confirm_password"],
  });

type ResetPasswordFormData = z.infer<typeof ResetPasswordSchema>;

export default function ResetPasswordPage() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useParams();
  const locale = pathname?.split("/")[1] ?? "id";
  const uidb64 = params?.uidb64 as string;
  const token = params?.token as string;

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [resetSuccess, setResetSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ResetPasswordFormData>({
    resolver: zodResolver(ResetPasswordSchema),
  });

  const { mutate: resetPassword, isPending } = useResetPasswordConfirm(
    uidb64,
    token,
    {
      onSuccess: (data) => {
        setResetSuccess(true);
        toast.success("Password Berhasil Direset!", {
          description: data.detail,
        });
        // Redirect to login after 3 seconds
        setTimeout(() => {
          router.push(`/${locale}/login`);
        }, 3000);
      },
      onError: (error) => {
        toast.error("Gagal Reset Password", {
          description: error.message,
        });
      },
    }
  );

  const onSubmit = (data: ResetPasswordFormData) => {
    resetPassword({ new_password: data.new_password });
  };

  if (resetSuccess) {
    return (
      <section>
        <div className="h-screen bg-[url(/img/img-2.webp)] bg-cover bg-no-repeat">
          <div className="absolute inset-0 bg-linear-to-b from-black/20 to-black/40"></div>

          <div className="relative z-10 flex min-h-screen items-center justify-center px-4">
            <div className="bg-card rounded-2xl p-8 max-w-md w-full">
              <div className="flex flex-col items-center text-center">
                {/* Logo */}
                <div className="mb-6">
                  <Image src={logo} alt="Logo" width={80} height={80} />
                </div>

                {/* Success Icon */}
                <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-green-500/20">
                  <CheckCircle className="h-10 w-10 text-green-500" />
                </div>

                {/* Title */}
                <h1 className="mb-3 text-2xl font-bold text-white">
                  Password Berhasil Direset!
                </h1>

                {/* Description */}
                <p className="mb-6 text-sm text-gray-300">
                  Password Anda telah berhasil diubah. Anda sekarang dapat login
                  dengan password baru Anda.
                </p>

                {/* Redirect Info */}
                <p className="mb-6 text-xs text-gray-400">
                  Mengarahkan ke halaman login dalam 3 detik...
                </p>

                {/* Action Button */}
                <Button
                  onClick={() => router.push(`/${locale}/login`)}
                  className="w-full bg-purple-600 hover:bg-purple-700"
                >
                  Login Sekarang
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section>
      <div className="h-screen bg-[url(/img/img-2.webp)] bg-cover bg-no-repeat">
        <div className="absolute inset-0 bg-linear-to-b from-black/20 to-black/40"></div>

        <div className="relative z-10 flex min-h-screen items-center justify-center px-4">
          <div className="bg-card rounded-2xl p-6">
            <div className="grid lg:grid-cols-2 gap-8">
              {/* Image Left - Hidden on mobile */}
              <div className="hidden lg:block">
                <Image
                  src={img4}
                  alt=""
                  className="w-125 rounded-xl bg-cover bg-no-repeat"
                />
              </div>

              {/* Form */}
              <div className="flex w-full flex-col justify-center max-w-md">
                {/* Logo */}
                <div className="mb-6 flex justify-center">
                  <Image src={logo} alt="Logo" width={80} height={80} />
                </div>

                {/* Title */}
                <div className="mb-6 text-center">
                  <h1 className="mb-2 text-2xl font-bold text-white">
                    Reset Password
                  </h1>
                  <p className="text-sm text-gray-300">
                    Masukkan password baru Anda
                  </p>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                  {/* New Password Input */}
                  <div className="space-y-2">
                    <Label htmlFor="new_password" className="text-sm text-white">
                      Password Baru
                    </Label>
                    <div className="relative">
                      <Input
                        id="new_password"
                        type={showPassword ? "text" : "password"}
                        placeholder="Minimal 8 karakter"
                        className="bg-foreground w-full border-0 p-5 pr-12 text-white placeholder:text-gray-400"
                        {...register("new_password")}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
                      >
                        {showPassword ? (
                          <EyeOff className="h-5 w-5" />
                        ) : (
                          <Eye className="h-5 w-5" />
                        )}
                      </button>
                    </div>
                    {errors.new_password && (
                      <p className="text-xs text-red-400">
                        {errors.new_password.message}
                      </p>
                    )}
                  </div>

                  {/* Confirm Password Input */}
                  <div className="space-y-2">
                    <Label
                      htmlFor="confirm_password"
                      className="text-sm text-white"
                    >
                      Konfirmasi Password
                    </Label>
                    <div className="relative">
                      <Input
                        id="confirm_password"
                        type={showConfirmPassword ? "text" : "password"}
                        placeholder="Ulangi password baru"
                        className="bg-foreground w-full border-0 p-5 pr-12 text-white placeholder:text-gray-400"
                        {...register("confirm_password")}
                      />
                      <button
                        type="button"
                        onClick={() =>
                          setShowConfirmPassword(!showConfirmPassword)
                        }
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
                      >
                        {showConfirmPassword ? (
                          <EyeOff className="h-5 w-5" />
                        ) : (
                          <Eye className="h-5 w-5" />
                        )}
                      </button>
                    </div>
                    {errors.confirm_password && (
                      <p className="text-xs text-red-400">
                        {errors.confirm_password.message}
                      </p>
                    )}
                  </div>

                  {/* Password Requirements */}
                  <div className="rounded-lg bg-gray-800/50 p-3">
                    <p className="mb-2 text-xs font-semibold text-gray-300">
                      Password harus memenuhi:
                    </p>
                    <ul className="space-y-1 text-xs text-gray-400">
                      <li>• Minimal 8 karakter</li>
                      <li>• Mengandung huruf besar dan kecil</li>
                      <li>• Mengandung angka</li>
                    </ul>
                  </div>

                  {/* Submit Button */}
                  <Button
                    type="submit"
                    disabled={isPending}
                    className="w-full bg-purple-600 hover:bg-purple-700"
                  >
                    {isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Mereset Password...
                      </>
                    ) : (
                      "Reset Password"
                    )}
                  </Button>

                  {/* Back to Login */}
                  <div className="text-center">
                    <Link
                      href={`/${locale}/login`}
                      className="text-sm text-purple-400 hover:text-purple-300"
                    >
                      Kembali ke Login
                    </Link>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
