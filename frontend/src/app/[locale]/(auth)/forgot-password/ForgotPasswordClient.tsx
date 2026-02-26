"use client";

import logo from "public/img/logo1.webp";
import img4 from "public/img/img-4.webp";

import { useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { ArrowLeft, Mail, Loader2 } from "lucide-react";

import Image from "next/image";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { Label } from "@radix-ui/react-label";
import { Button } from "@/components/ui/button";
import { useRequestPasswordReset } from "@/lib/password-reset";

// Validation Schema
const ForgotPasswordSchema = z.object({
  email: z.string().email("Email tidak valid"),
});

type ForgotPasswordFormData = z.infer<typeof ForgotPasswordSchema>;

export default function ForgotPasswordPage() {
  const router = useRouter();
  const pathname = usePathname();
  const locale = pathname?.split("/")[1] ?? "id";
  const [emailSent, setEmailSent] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    getValues,
  } = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(ForgotPasswordSchema),
  });

  const { mutate: requestReset, isPending } = useRequestPasswordReset({
    onSuccess: (data) => {
      setEmailSent(true);
      toast.success("Email Terkirim!", {
        description: data.detail,
      });
    },
    onError: (error) => {
      toast.error("Gagal Mengirim Email", {
        description: error.message,
      });
    },
  });

  const onSubmit = (data: ForgotPasswordFormData) => {
    requestReset(data);
  };

  if (emailSent) {
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
                  <Mail className="h-10 w-10 text-green-500" />
                </div>

                {/* Title */}
                <h1 className="mb-3 text-2xl font-bold text-white">
                  Email Terkirim!
                </h1>

                {/* Description */}
                <p className="mb-6 text-sm text-gray-300">
                  Kami telah mengirim link reset password ke{" "}
                  <span className="font-semibold text-white">
                    {getValues("email")}
                  </span>
                  . Silakan cek inbox atau folder spam Anda.
                </p>

                {/* Action Buttons */}
                <div className="flex w-full flex-col gap-3">
                  <Button
                    onClick={() => router.push(`/${locale}/login`)}
                    className="w-full bg-purple-600 hover:bg-purple-700"
                  >
                    Kembali ke Login
                  </Button>

                  <Button
                    onClick={() => setEmailSent(false)}
                    variant="outline"
                    className="w-full"
                  >
                    Kirim Ulang Email
                  </Button>
                </div>
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
                    Lupa Password?
                  </h1>
                  <p className="text-sm text-gray-300">
                    Masukkan email Anda dan kami akan mengirimkan link untuk
                    reset password.
                  </p>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                  {/* Email Input */}
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-sm text-white">
                      Email
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="nama@email.com"
                      className="bg-muted-foreground text-white placeholder-white"
                      {...register("email")}
                    />
                    {errors.email && (
                      <p className="text-xs text-red-500">
                        {errors.email.message}
                      </p>
                    )}
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
                        Mengirim Email...
                      </>
                    ) : (
                      "Kirim Link Reset Password"
                    )}
                  </Button>

                  {/* Back to Login */}
                  <div className="text-center">
                    <Link
                      href={`/${locale}/login`}
                      className="inline-flex items-center text-sm text-purple-400 hover:text-purple-300"
                    >
                      <ArrowLeft className="mr-1 h-4 w-4" />
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
