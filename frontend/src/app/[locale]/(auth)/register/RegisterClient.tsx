"use client";

import img4 from "public/img/img-4.webp";

import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { useGoogleLogin } from "@react-oauth/google";

import Image from "next/image";
import { Input } from "@/components/ui/input";
import { Label } from "@radix-ui/react-label";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { PhoneInputAuth } from "@/components/ui/phone-input-auth";
import { Checkbox } from "@/components/ui/checkbox";
import { usePathname, useRouter } from "next/navigation";
import { toast } from "sonner";
import { useAuth, useRegister } from "@/lib/auth";
import { useEffect } from "react";
import { env } from "@/env";
import { API_URL } from "@/lib/api-url";

export default function RegisterPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const { session, isLoading: isPending } = useAuth();
  const locale = pathname?.split("/")[1] ?? "id";

  // Register mutation with auto-login
  const {
    register,
    isPending: isRegistering,
    error: registerError,
  } = useRegister({
    isAdmin: false,
    redirectTo: `/${locale}/profile`,
  });

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

  // Handle Google Sign-In for registration (define before early returns)
  const handleGoogleSuccess = async (tokenResponse: any) => {
    const loadingToast = toast.loading("Memproses registrasi Google...", {
      description: "Mohon tunggu sebentar...",
    });

    try {
      // First, get user info from Google using the access token
      const userInfoResponse = await fetch(
        "https://www.googleapis.com/oauth2/v3/userinfo",
        {
          headers: {
            Authorization: `Bearer ${tokenResponse.access_token}`,
          },
        },
      );

      if (!userInfoResponse.ok) {
        throw new Error("Failed to get user info from Google");
      }

      const userInfo = await userInfoResponse.json();

      // Get the backend API URL
      const backendUrl = API_URL;

      // Send the user info to your Django backend
      const response = await fetch(`${backendUrl}/api/v1/auth/google/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include", // Important for httpOnly cookies
        body: JSON.stringify({
          email: userInfo.email,
          google_id: userInfo.sub,
          full_name: userInfo.name,
          picture: userInfo.picture,
          email_verified: userInfo.email_verified,
        }),
      });

      const data = await response.json();

      toast.dismiss(loadingToast);

      if (response.ok) {
        toast.success(
          data.is_new_user ? "Akun Berhasil Dibuat!" : "Login Berhasil!",
          {
            description: data.is_new_user
              ? "Selamat datang! Mengarahkan ke profil Anda..."
              : "Mengarahkan ke profil Anda...",
          },
        );

        const locale = pathname.split("/")[1] ?? "id";
        // Force full page reload to ensure cookies are loaded
        window.location.href = `/${locale}/profile?from=google`;
      } else {
        if (data.error_code === "STAFF_ACCOUNT") {
          toast.error("Akun Staff Terdeteksi", {
            description:
              "Akun Google ini terhubung dengan akun staff. Silakan gunakan login admin.",
          });
        } else {
          toast.error("Registrasi Google Gagal", {
            description:
              data.detail || "Terjadi kesalahan saat registrasi dengan Google.",
          });
        }
      }
    } catch (error) {
      toast.dismiss(loadingToast);
      toast.error("Registrasi Google Gagal", {
        description: "Tidak dapat terhubung ke server. Silakan coba lagi.",
      });
      console.error("Google registration error:", error);
    }
  };

  // Google login hook (must be called before early returns)
  const googleLogin = useGoogleLogin({
    // eslint-disable-next-line @typescript-eslint/no-misused-promises
    onSuccess: handleGoogleSuccess,
    onError: () => {
      toast.error("Registrasi Google Gagal", {
        description: "Terjadi kesalahan saat registrasi dengan Google.",
      });
    },
  });

  // Redirect if already logged in with role-based routing
  useEffect(() => {
    if (session?.user) {
      const isStaff = session.user.role === "STAFF";

      if (isStaff) {
        // Staff user trying to access public register - redirect to admin
        router.replace("/admin");
      } else {
        // Regular customer - redirect to profile
        router.replace(`/${locale}/profile`);
      }
    }
  }, [session, router, locale]);

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
    // Last name is optional

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

    setErrors({});

    // Call register mutation - it will auto-login and redirect
    register({
      email: form.email,
      password: form.password,
      full_name: `${form.firstName} ${form.lastName}`.trim(),
      contact_phone: form.phone,
    });
  };

  // Show loading while checking session
  if (isPending) {
    return (
      <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-linear-to-br from-gray-900 via-gray-800 to-gray-900">
        <div className="text-lg text-white">Memuat...</div>
      </div>
    );
  }

  // Don't render register form if already authenticated (will redirect)
  if (session?.user) {
    return null;
  }

  return (
    <>
      <section>
        <div className="h-full bg-[url(/img/img-2.webp)] bg-cover bg-no-repeat lg:h-screen">
          <div className="absolute inset-0 bg-linear-to-b from-black/20 to-black/40"></div>

          <div className="relative z-10 mx-auto flex min-h-screen w-full items-center justify-center px-4 py-8 lg:w-11/12 lg:max-w-7xl">
            <div className="bg-card mx-auto w-full max-w-md rounded-2xl p-4 sm:p-6 lg:max-w-none">
              <div className="grid items-stretch lg:grid-cols-2 lg:gap-8">
                <div className="hidden h-full lg:block">
                  <Image
                    src={img4}
                    alt=""
                    className="h-full w-full rounded-xl object-cover"
                  />
                </div>

                <div className="flex w-full flex-col justify-center">
                  <div className="flex flex-col items-center justify-center">
                    <h1 className="text-xl font-semibold text-white lg:mt-4 lg:text-2xl">
                      Selamat Datang
                    </h1>
                    <p className="mt-1 text-base font-light text-white">
                      Masukkan informasi pendaftaran yang valid.
                    </p>
                  </div>

                  <div>
                    {/* Nama depan & belakang */}
                    <div className="flex flex-col lg:flex-row lg:gap-3">
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
                          Nama Belakang{" "}
                          <span className="text-gray-400">(opsional)</span>
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

                    <div className="relative mt-5 grid w-full gap-1">
                      <Label htmlFor="phone" className="text-sm text-white">
                        Nomor WhatsApp
                      </Label>

                      <PhoneInputAuth
                        id="phone"
                        value={form.phone}
                        onChange={(val: string) =>
                          setForm({ ...form, phone: val })
                        }
                        placeholder="812 3456 7890"
                      />

                      {errors.phone && (
                        <p className="text-xs text-red-400">{errors.phone}</p>
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

                    <div className="flex flex-col lg:flex-row lg:gap-3">
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
                            onClick={() =>
                              setShowConfirmPassword(!showConfirmPassword)
                            }
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
                        <Link
                          href={"/termsconditions"}
                          className="text-blue-400"
                        >
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
                  <div className="mt-6 space-y-3">
                    <Button
                      onClick={handleSubmit}
                      disabled={isRegistering}
                      className="bg-primary w-full cursor-pointer text-white disabled:opacity-50"
                    >
                      {isRegistering ? "Memproses..." : "Daftar"}
                    </Button>

                    {env.NEXT_PUBLIC_GOOGLE_CLIENT_ID && (
                      <>
                        <Button
                          type="button"
                          onClick={() => googleLogin()}
                          className="w-full border border-gray-300 bg-white text-gray-700 hover:bg-gray-100"
                        >
                          <svg className="mr-2 h-5 w-5" viewBox="0 0 24 24">
                            <path
                              fill="currentColor"
                              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                            />
                            <path
                              fill="currentColor"
                              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                            />
                            <path
                              fill="currentColor"
                              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                            />
                            <path
                              fill="currentColor"
                              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                            />
                          </svg>
                          Daftar dengan Google
                        </Button>
                      </>
                    )}
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
