/* eslint-disable @typescript-eslint/no-unused-vars */
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
import { usePathname, useRouter } from "next/navigation";
import { toast } from "sonner";
import { useSession } from "@/lib/auth-client";
import { useEffect } from "react";

export default function RegisterPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const { data: session, isPending } = useSession();

  // state form (must be called before any early returns)
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    phone: "",
    email: "",
    password: "",
    confirmPassword: "",
    terms: false,
  });

  // error state (must be called before any early returns)
  const [errors, setErrors] = useState<any>({});

  // Redirect if already logged in
  useEffect(() => {
    if (session?.user) {
      const locale = pathname?.split("/")[1] ?? "id";
      router.replace(`/${locale}/profile`);
    }
  }, [session, router, pathname]);

  // Show loading while checking session
  if (isPending) {
    return (
      <div className="relative min-h-screen flex items-center justify-center bg-linear-to-br from-gray-900 via-gray-800 to-gray-900 overflow-hidden">
        <div className="text-white text-lg">Memuat...</div>
      </div>
    );
  }

  // Don't render register form if already authenticated (will redirect)
  if (session?.user) {
    return null;
  }

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

  const handleSubmit = async () => {
    if (!validate()) {
      toast.error("Validasi Gagal", {
        description: "Harap periksa kembali data yang Anda masukkan.",
      });
      return;
    }

    setIsSubmitting(true);
    setErrors({});

    try {
      const loadingToast = toast.loading("Mendaftarkan akun...", {
        description: "Mohon tunggu sebentar...",
      });

      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: form.email,
          password: form.password,
          name: `${form.firstName} ${form.lastName}`.trim(),
          phone: form.phone,
        }),
      });

      const data = await response.json();
      toast.dismiss(loadingToast);

      if (!response.ok) {
        setErrors({ email: data.message || "Registrasi gagal" });
        toast.error("Registrasi Gagal", {
          description: data.message || "Email mungkin sudah terdaftar. Silakan coba lagi.",
        });
        setIsSubmitting(false);
        return;
      }

      toast.success("Registrasi Berhasil", {
        description: "Akun Anda berhasil dibuat! Mengarahkan ke profil...",
      });

      // Auto-login after successful registration using BetterAuth
      // Wait a bit to ensure database transaction is committed
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const { signIn } = await import("@/lib/auth-client");
      
      try {
        console.log("Attempting auto-login for:", form.email);
        const result = await signIn.email({
          email: form.email,
          password: form.password,
        });

        console.log("SignIn result:", result);

        if (!result.error) {
          // Wait a bit more to ensure session is created in database
          await new Promise(resolve => setTimeout(resolve, 300));
          
          toast.success("Login Otomatis Berhasil", {
            description: "Selamat datang! Mengarahkan ke profil Anda...",
          });
          // Get locale from pathname
          const locale = pathname.split("/")[1] ?? "id";
          // Use window.location for full page reload to ensure session is loaded
          setTimeout(() => {
            window.location.href = `/${locale}/profile?from=login`;
          }, 1000);
        } else {
          // Registration successful but login failed, redirect to login
          console.error("Auto-login failed:", result.error);
          toast.warning("Login Otomatis Gagal", {
            description: result.error.message || "Registrasi berhasil! Silakan login secara manual.",
          });
          const locale = pathname.split("/")[1] ?? "id";
          setTimeout(() => {
            window.location.href = `/${locale}/login?registered=true&email=${encodeURIComponent(form.email)}`;
          }, 2000);
        }
      } catch (loginError) {
        console.error("Auto-login error:", loginError);
        // Registration successful but login failed, redirect to login
        toast.warning("Login Otomatis Gagal", {
          description: "Registrasi berhasil! Silakan login secara manual.",
        });
        const locale = pathname.split("/")[1] ?? "id";
        setTimeout(() => {
          window.location.href = `/${locale}/login?registered=true&email=${encodeURIComponent(form.email)}`;
        }, 2000);
      }
    } catch (err) {
      setErrors({ email: "Terjadi kesalahan saat registrasi" });
      toast.error("Registrasi Gagal", {
        description: "Terjadi kesalahan saat registrasi. Silakan coba lagi.",
      });
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <section>
        <div className="h-screen bg-[url(/img/img-2.webp)] bg-cover bg-no-repeat">
          <div className="absolute inset-0 bg-linear-to-b from-black/20 to-black/40"></div>

          <div className="relative z-10 flex min-h-screen items-center justify-center mx-3 lg:mx-0">
            <div className="bg-card rounded-2xl p-6">
              <div className="grid lg:grid-cols-2 lg:gap-8">
                <div>
                  <Image
                    src={img4}
                    alt=""
                    className="w-[600] rounded-xl bg-cover bg-no-repeat lg:block hidden"
                  />
                </div>

                <div className="flex w-full flex-col justify-center">
                  <div className="flex flex-col items-center justify-center">
                    <h1 className="lg:mt-4 text-2xl font-semibold text-white">
                      Selamat Datang di Roxas Store
                    </h1>
                    <p className="mt-1 font-light text-white">
                      Masukkan informasi pendaftaran yang valid.
                    </p>
                  </div>

                  <div>
                    {/* Nama depan & belakang */}
                    <div className="flex lg:flex-row flex-col lg:gap-3">
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

                    <div className="mt-6">
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

                    <div className="flex lg:flex-row flex-col lg:gap-3">
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
                        <Link href={"/termsconditions"} className="text-blue-400">
                          Syarat & Ketentuan
                        </Link>{" "}
                        dan{" "}
                        <Link href={"/privacypolicy"} className="text-blue-400">
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
                      disabled={isSubmitting}
                      className="bg-primary mt-6 w-full cursor-pointer text-white disabled:opacity-50"
                    >
                      {isSubmitting ? "Memproses..." : "Daftar"}
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
