/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
"use client";

import img4 from "public/img/img-4.webp";

import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";

import Image from "next/image";
import { Input } from "@/components/ui/input";
import { Label } from "@radix-ui/react-label";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import CountryPhoneInput from "@/components/section/register/CountryPhoneInput";
import { Checkbox } from "@/components/ui/checkbox";

export default function RegisterPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // state form
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    phone: "",
    email: "",
    password: "",
    confirmPassword: "",
    terms: false,
  });

  // error state
  const [errors, setErrors] = useState<any>({});

  // handler input
  const handleChange = (e: any) => {
    setForm({
      ...form,
      [e.target.id]: e.target.value,
    });
  };

  // validasi
  const validate = () => {
    const newErrors: any = {};

    if (!form.firstName.trim()) newErrors.firstName = "Nama depan wajib diisi.";
    if (!form.lastName.trim())
      newErrors.lastName = "Nama belakang wajib diisi.";

    if (!form.phone.trim()) newErrors.phone = "Nomor telepon wajib diisi.";

    if (!form.email.trim()) {
      newErrors.email = "Email wajib diisi.";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      newErrors.email = "Format email tidak valid.";
    }

    if (!form.password) {
      newErrors.password = "Kata sandi wajib diisi.";
    } else if (form.password.length < 8) {
      newErrors.password = "Kata sandi minimal 8 karakter.";
    }

    if (form.password !== form.confirmPassword)
      newErrors.confirmPassword = "Konfirmasi kata sandi tidak cocok.";

    if (!form.terms)
      newErrors.terms = "Anda harus menyetujui syarat & ketentuan.";

    setErrors(newErrors);

    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (validate()) {
      alert("Form Valid!");
    }
  };

  return (
    <>
      <section>
        <div className="h-screen bg-[url(/img/img-2.webp)] bg-cover bg-no-repeat">
          <div className="absolute inset-0 bg-linear-to-b from-black/20 to-black/40"></div>

          <div className="relative z-10 flex min-h-screen items-center justify-center">
            <div className="bg-card rounded-2xl p-6">
              <div className="grid grid-cols-2 gap-8">
                <div>
                  <Image
                    src={img4}
                    alt=""
                    className="w-[600] rounded-xl bg-cover bg-no-repeat"
                  />
                </div>

                <div className="flex w-full flex-col justify-center">
                  <div className="flex flex-col items-center justify-center">
                    <h1 className="mt-4 text-2xl font-semibold text-white">
                      Selamat Datang di Roxas Store
                    </h1>
                    <p className="mt-1 font-light text-white">
                      Masukkan informasi pendaftaran yang valid.
                    </p>
                  </div>

                  <div>
                    {/* Nama depan & belakang */}
                    <div className="flex gap-3">
                      <div className="mt-8 grid w-full gap-1">
                        <Label
                          htmlFor="firstName"
                          className="text-sm text-white"
                        >
                          Nama Depan
                        </Label>
                        <Input
                          type="text"
                          id="firstName"
                          placeholder="Masukkan nama depan Kamu"
                          onChange={handleChange}
                          className="bg-foreground w-full border-0 p-5 text-white placeholder:text-gray-400"
                        />
                        {errors.firstName && (
                          <p className="text-xs text-red-400">
                            {errors.firstName}
                          </p>
                        )}
                      </div>

                      <div className="mt-8 grid w-full gap-1">
                        <Label
                          htmlFor="lastName"
                          className="text-sm text-white"
                        >
                          Nama Belakang
                        </Label>
                        <Input
                          type="text"
                          id="lastName"
                          placeholder="Masukkan nama belakang Kamu"
                          onChange={handleChange}
                          className="bg-foreground w-full border-0 p-5 text-white placeholder:text-gray-400"
                        />
                        {errors.lastName && (
                          <p className="text-xs text-red-400">
                            {errors.lastName}
                          </p>
                        )}
                      </div>
                    </div>

                    <div>
                      <CountryPhoneInput
                        value={form.phone}
                        onChange={(val: string) =>
                          setForm({ ...form, phone: val })
                        }
                      />
                      {errors.phone && (
                        <p className="mt-1 text-xs text-red-400">
                          {errors.phone}
                        </p>
                      )}
                    </div>

                    <div className="mt-6 grid w-full gap-1">
                      <Label htmlFor="email" className="text-sm text-white">
                        Email
                      </Label>
                      <Input
                        type="email"
                        id="email"
                        placeholder="Masukkan email Kamu"
                        onChange={handleChange}
                        className="bg-foreground w-full border-0 p-5 text-white placeholder:text-gray-400"
                      />
                      {errors.email && (
                        <p className="text-xs text-red-400">{errors.email}</p>
                      )}
                    </div>

                    <div className="flex gap-3">
                      <div className="mt-6 grid w-full gap-1">
                        <Label
                          htmlFor="password"
                          className="text-sm text-white"
                        >
                          Kata Sandi
                        </Label>
                        <div className="relative">
                          <Input
                            type={showPassword ? "text" : "password"}
                            id="password"
                            placeholder="Masukkan kata sandi Kamu"
                            onChange={handleChange}
                            className="bg-foreground w-full border-0 p-5 text-white placeholder:text-gray-400"
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute top-1/2 right-4 -translate-y-1/2 cursor-pointer text-white"
                          >
                            {showPassword ? (
                              <EyeOff size={20} />
                            ) : (
                              <Eye size={20} />
                            )}
                          </button>
                        </div>
                        {errors.password && (
                          <p className="text-xs text-red-400">
                            {errors.password}
                          </p>
                        )}
                      </div>

                      <div className="mt-6 grid w-full gap-1">
                        <Label
                          htmlFor="confirmPassword"
                          className="text-sm text-white"
                        >
                          Konfirmasi Kata Sandi
                        </Label>
                        <div className="relative">
                          <Input
                            type={showConfirmPassword ? "text" : "password"}
                            id="confirmPassword"
                            placeholder="Masukkan ulang kata sandi"
                            onChange={handleChange}
                            className="bg-foreground w-full border-0 p-5 text-white placeholder:text-gray-400"
                          />
                          <button
                            type="button"
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            className="absolute top-1/2 right-4 -translate-y-1/2 cursor-pointer text-white"
                          >
                            {showConfirmPassword ? (
                              <EyeOff size={20} />
                            ) : (
                              <Eye size={20} />
                            )}
                          </button>
                        </div>
                        {errors.confirmPassword && (
                          <p className="text-xs text-red-400">
                            {errors.confirmPassword}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Checkbox */}
                  <div className="mt-6">
                    <div className="flex items-center gap-3">
                      <Checkbox
                        id="terms"
                        checked={form.terms}
                        onCheckedChange={(v: any) =>
                          setForm({ ...form, terms: Boolean(v) })
                        }
                        className="cursor-pointer"
                      />
                      <Label htmlFor="terms" className="text-sm text-white">
                        Saya setuju dengan{" "}
                        <Link href={""} className="text-blue-400">
                          Syarat & Ketentuan
                        </Link>{" "}
                        dan{" "}
                        <Link href={""} className="text-blue-400">
                          Kebijakan Pribadi
                        </Link>
                        .
                      </Label>
                    </div>
                    {errors.terms && (
                      <p className="mt-1 text-xs text-red-400">
                        {errors.terms}
                      </p>
                    )}
                  </div>

                  {/* Button */}
                  <div>
                    <Button
                      onClick={handleSubmit}
                      className="bg-primary mt-6 w-full cursor-pointer text-white"
                    >
                      Daftar
                    </Button>
                  </div>

                  {/* Login link */}
                  <div className="mt-4 text-center">
                    <p className="text-sm font-light text-white">
                      Sudah punya akun?{" "}
                      <span className="font-medium">
                        <Link href={"/login"} className="text-blue-400">
                          Masuk
                        </Link>
                      </span>
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
