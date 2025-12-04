/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import img4 from "public/img/img-4.webp";
import logo from "public/img/logo.webp";

import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";

import Image from "next/image";
import { Input } from "@/components/ui/input";
import { Label } from "@radix-ui/react-label";
import { Checkbox } from "@/components/ui/checkbox";
import Link from "next/link";
import { Button } from "@/components/ui/button";

import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

// ⚡ Validation Schema
const LoginSchema = z.object({
  email: z.string().email("Email tidak valid"),
  password: z.string().min(8, "Kata sandi minimal 8 karakter"),
});

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);

  // ⚡ Connect form + validation
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(LoginSchema),
  });

  // ⚡ Submit Form
  const onSubmit = (data: any) => {
    console.log("Berhasil Login:", data);
  };

  return (
    <>
      <section>
        <div className="h-screen bg-[url(/img/img-2.webp)] bg-cover bg-no-repeat">
          <div className="absolute inset-0 bg-linear-to-b from-black/20 to-black/40"></div>

          <div className="relative z-10 flex min-h-screen items-center justify-center">
            <div className="bg-card rounded-2xl p-6">
              <div className="grid grid-cols-2 gap-8">

                {/* Gambar kiri */}
                <div>
                  <Image
                    src={img4}
                    alt=""
                    className="w-[500px] rounded-xl bg-cover bg-no-repeat"
                  />
                </div>

                {/* Form */}
                <div className="flex w-full flex-col justify-center">

                  {/* Logo */}
                  <div className="flex justify-center items-center">
                    <Image alt="" src={logo} className="w-52 mb-4" />
                  </div>

                  {/* Title */}
                  <div className="text-center">
                    <h1 className="mt-4 text-2xl font-semibold text-white">
                      Selamat Datang Kembali
                    </h1>
                    <p className="mt-1 font-light text-white">
                      Masuk dengan akun yang telah Kamu daftarkan.
                    </p>
                  </div>

                  {/* FORM */}
                  <form onSubmit={handleSubmit(onSubmit)}>
                    {/* EMAIL */}
                    <div className="mt-8 grid w-full gap-1">
                      <Label htmlFor="email" className="text-sm text-white">
                        Email
                      </Label>

                      <Input
                        type="email"
                        id="email"
                        placeholder="Masukkan email Kamu"
                        {...register("email")}
                        className={`bg-foreground w-full border-0 p-5 text-white placeholder:text-gray-400 ${
                          errors.email ? "border border-red-500" : ""
                        }`}
                      />

                      {errors.email && (
                        <p className="text-red-400 text-sm mt-1">
                          {errors.email.message}
                        </p>
                      )}
                    </div>

                    {/* PASSWORD */}
                    <div className="mt-6 grid w-full gap-1">
                      <Label htmlFor="password" className="text-sm text-white">
                        Kata Sandi
                      </Label>

                      <div className="relative">
                        <Input
                          type={showPassword ? "text" : "password"}
                          id="password"
                          placeholder="Masukkan kata sandi Kamu"
                          {...register("password")}
                          className={`bg-foreground w-full border-0 p-5 text-white placeholder:text-gray-400 ${
                            errors.password ? "border border-red-500" : ""
                          }`}
                        />

                        {/* Toggle password */}
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute top-1/2 right-4 -translate-y-1/2 cursor-pointer text-white"
                        >
                          {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                        </button>
                      </div>

                      {errors.password && (
                        <p className="text-red-400 text-sm mt-1">
                          {errors.password.message}
                        </p>
                      )}

                      <Link
                        href="#"
                        className="mt-1 flex justify-end text-sm text-blue-400"
                      >
                        Lupa kata sandi mu?
                      </Link>
                    </div>

                    {/* Remember Me */}
                    <div className="mt-3 flex items-center gap-3">
                      <Checkbox id="terms" />
                      <Label htmlFor="terms" className="text-sm text-white">
                        Ingat akun ku
                      </Label>
                    </div>

                    {/* Submit */}
                    <Button
                      type="submit"
                      disabled={isSubmitting}
                      className="bg-primary mt-6 w-full cursor-pointer text-white"
                    >
                      {isSubmitting ? "Memproses..." : "Masuk"}
                    </Button>
                  </form>

                  {/* Register */}
                  <div className="mt-4 text-center">
                    <p className="text-sm font-light text-white">
                      Belum punya akun?{" "}
                      <Link href="/register" className="text-blue-400 font-medium">
                        Daftar
                      </Link>
                    </p>
                  </div>

                </div>
              </div>
            </div>

          </div>
        </div>
      </section>
    </>
  );
}
