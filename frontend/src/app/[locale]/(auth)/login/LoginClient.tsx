"use client";

import img4 from "public/img/img-4.webp";
import logo from "public/img/logo1.webp";

import { useState, useEffect } from "react";
import { Eye, EyeOff, Mail, Loader2 } from "lucide-react";
import { useGoogleLogin } from "@react-oauth/google";

import Image from "next/image";
import { Input } from "@/components/ui/input";
import { Label } from "@radix-ui/react-label";
import { Checkbox } from "@/components/ui/checkbox";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAuth, useLogin } from "@/lib/auth";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { env } from "@/env";
import { API_URL } from "@/lib/api-url";
import { useRequestPasswordReset } from "@/lib/password-reset";

// ⚡ Validation Schema
const LoginSchema = z.object({
  email: z.string().email("Email tidak valid"),
  password: z.string().min(8, "Kata sandi minimal 8 karakter"),
});

const ForgotPasswordSchema = z.object({
  email: z.string().email("Email tidak valid"),
});

type ForgotPasswordFormData = z.infer<typeof ForgotPasswordSchema>;

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showForgotPasswordModal, setShowForgotPasswordModal] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { session, isLoading: isPending } = useAuth();
  const locale = pathname?.split("/")[1] ?? "id";

  // Honour callbackUrl set by pages that require auth (e.g. product detail pay button)
  const callbackUrl = searchParams.get("callbackUrl") ?? `/${locale}/profile`;

  const { login, isLoading: isSubmitting, error: loginError } = useLogin({
    isAdmin: false, // Public login - admin users NOT allowed
    redirectTo: callbackUrl,
  });
  
  // ⚡ Connect form + validation (must be called before any early returns)
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(LoginSchema),
  });

  // Handle Google Sign-In (define before early returns)
  const handleGoogleSuccess = async (tokenResponse: any) => {
    const loadingToast = toast.loading("Memproses login Google...", {
      description: "Mohon tunggu sebentar...",
    });

    try {
      // First, get user info from Google using the access token
      const userInfoResponse = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
        headers: {
          Authorization: `Bearer ${tokenResponse.access_token}`,
        },
      });

      if (!userInfoResponse.ok) {
        throw new Error('Failed to get user info from Google');
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
        toast.success(data.is_new_user ? "Akun Berhasil Dibuat!" : "Login Berhasil!", {
          description: data.is_new_user 
            ? "Selamat datang! Mengarahkan ke profil Anda..." 
            : "Mengarahkan ke profil Anda...",
        });

        // Force full page reload to ensure cookies are loaded; honour callbackUrl
        window.location.href = callbackUrl;
      } else {
        if (data.error_code === "STAFF_ACCOUNT") {
          toast.error("Akun Staff Terdeteksi", {
            description: "Akun Google ini terhubung dengan akun staff. Silakan gunakan login admin.",
          });
        } else {
          toast.error("Login Google Gagal", {
            description: data.detail || "Terjadi kesalahan saat login dengan Google.",
          });
        }
      }
    } catch (error) {
      toast.dismiss(loadingToast);
      toast.error("Login Google Gagal", {
        description: "Tidak dapat terhubung ke server. Silakan coba lagi.",
      });
      console.error("Google login error:", error);
    }
  };

  // Google login hook (must be called before early returns)
  const googleLogin = useGoogleLogin({
    onSuccess: handleGoogleSuccess,
    onError: () => {
      toast.error("Login Google Gagal", {
        description: "Terjadi kesalahan saat login dengan Google.",
      });
    },
  });

  // Redirect if already logged in with role-based routing
  useEffect(() => {
    if (!isPending && session?.user) {
      const isStaff = session.user.role === "STAFF";
      
      if (isStaff) {
        // Staff user trying to access public login - redirect to admin
        toast.info("Staff Account Detected", {
          description: "Redirecting to admin panel...",
        });
        setTimeout(() => {
          window.location.href = "/admin";
        }, 500);
      } else {
        // Regular customer - redirect to callbackUrl or profile
        router.replace(callbackUrl);
      }
    }
  }, [session, isPending, router, locale, callbackUrl]);

  // Check for OAuth errors and registration success message
  useEffect(() => {
    // Check for OAuth account linking error
    const error = searchParams.get("error");
    if (error === "OAuthAccountNotLinked") {
      toast.error("Akun Google Sudah Terhubung", {
        description: "Akun Google ini sudah terhubung dengan akun lain. Silakan gunakan email dan password untuk login.",
      });
      // Remove error from URL
      router.replace(pathname || "/login");
    }
    
    if (searchParams.get("registered") === "true") {
      const email = searchParams.get("email");
      if (email) {
        // Pre-fill email if provided
        const emailInput = document.getElementById("email") as HTMLInputElement;
        if (emailInput) {
          emailInput.value = email;
        }
      }
    }
  }, [router, pathname, searchParams]);

  // ⚡ Submit Form
  const onSubmit = async (data: any) => {
    setError(null);
    login({
      email: data.email,
      password: data.password,
    });
  };

  // Forgot password form
  const {
    register: registerForgot,
    handleSubmit: handleSubmitForgot,
    formState: { errors: forgotErrors },
    reset: resetForgotForm,
  } = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(ForgotPasswordSchema),
  });

  const { mutate: requestReset, isPending: isResetting } = useRequestPasswordReset({
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

  const onSubmitForgotPassword = (data: ForgotPasswordFormData) => {
    requestReset(data);
  };

  const handleCloseForgotPasswordModal = () => {
    setShowForgotPasswordModal(false);
    setEmailSent(false);
    resetForgotForm();
  };

  // Show loading while checking session
  if (isPending) {
    return (
      <div className="h-screen bg-[url(/img/img-2.webp)] bg-cover bg-no-repeat flex items-center justify-center">
        <div className="text-white text-lg">Memuat...</div>
      </div>
    );
  }

  // Don't render login form if already authenticated (will redirect)
  if (session?.user) {
    return null;
  }

  return (
    <>
      <section>
        <div className="h-screen bg-[url(/img/img-2.webp)] bg-cover bg-no-repeat">
          <div className="absolute inset-0 bg-linear-to-b lg:from-black/20 lg:to-black/40 from-black/50 to-black/80"></div>

          <div className="relative z-10 flex min-h-screen items-center justify-center">
            <div className="bg-card rounded-2xl p-6">
              <div className="grid lg:grid-cols-2 lg:gap-8">

                {/* Gambar kiri */}
                <div>
                  <Image
                    src={img4}
                    alt=""
                    className="w-125 rounded-xl bg-cover bg-no-repeat lg:block hidden"
                  />
                </div>

                {/* Form */}
                <div className="flex w-full flex-col justify-center">

                  {/* Logo */}
                  <div className="flex justify-center items-center">
                    <Image alt="" src={logo} className="w-56 mb-1 lg:block hidden" />
                  </div>

                  {/* Title */}
                  <div className="text-center">
                    <h1 className="lg:mt-4 text-2xl font-semibold text-white">
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
                      {error && !errors.email && (
                        <p className="text-red-400 text-sm mt-1">{error}</p>
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

                      <button
                        type="button"
                        onClick={() => setShowForgotPasswordModal(true)}
                        className="mt-1 flex justify-end text-sm text-purple-400 hover:text-purple-300 transition-colors"
                      >
                        Lupa kata sandi mu?
                      </button>
                    </div>

                    {/* Submit and Google Sign In - Same Row */}
                    <div className="mt-6 lg:flex lg:flex-row flex flex-col gap-3">
                      <Button
                        type="submit"
                        disabled={isSubmitting}
                        className="bg-primary flex-1 cursor-pointer text-white"
                      >
                        {isSubmitting ? "Memproses..." : "Masuk"}
                      </Button>

                      {env.NEXT_PUBLIC_GOOGLE_CLIENT_ID && (
                        <Button
                          type="button"
                          onClick={() => googleLogin()}
                          className="bg-white text-gray-700 hover:bg-gray-100 border border-gray-300 flex-1"
                        >
                          <svg className="w-5 h-5" viewBox="0 0 24 24">
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
                          Google
                        </Button>
                      )}
                    </div>
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

      {/* Forgot Password Modal */}
      <Dialog open={showForgotPasswordModal} onOpenChange={handleCloseForgotPasswordModal}>
        <DialogContent className="sm:max-w-md bg-card border-gray-700">
          {!emailSent ? (
            <>
              <DialogHeader>
                <DialogTitle className="text-white text-xl">Lupa Password?</DialogTitle>
                <DialogDescription className="text-gray-300">
                  Masukkan email Anda dan kami akan mengirimkan link untuk reset password.
                </DialogDescription>
              </DialogHeader>

              <form onSubmit={handleSubmitForgot(onSubmitForgotPassword)} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="forgot-email" className="text-sm text-white">Email</Label>
                  <Input
                    id="forgot-email"
                    type="email"
                    placeholder="Masukkan email Kamu"
                    {...registerForgot("email")}
                    className={`bg-foreground w-full border-0 p-5 text-white placeholder:text-gray-400 ${
                      forgotErrors.email ? "border border-red-500" : ""
                    }`}
                  />
                  {forgotErrors.email && (
                    <p className="text-red-400 text-sm">{forgotErrors.email.message}</p>
                  )}
                </div>

                <div className="flex gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleCloseForgotPasswordModal}
                    className="flex-1 border-gray-600 text-white hover:bg-gray-700"
                  >
                    Batal
                  </Button>
                  <Button
                    type="submit"
                    disabled={isResetting}
                    className="flex-1 bg-purple-600 hover:bg-purple-700 text-white"
                  >
                    {isResetting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Mengirim...
                      </>
                    ) : (
                      "Kirim Email"
                    )}
                  </Button>
                </div>
              </form>
            </>
          ) : (
            <>
              <DialogHeader>
                <div className="flex justify-center mb-4">
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-500/20">
                    <Mail className="h-8 w-8 text-green-500" />
                  </div>
                </div>
                <DialogTitle className="text-center text-white text-xl">Email Terkirim!</DialogTitle>
                <DialogDescription className="text-center text-gray-300">
                  Kami telah mengirimkan link reset password ke email Anda. Silakan cek inbox atau folder spam.
                </DialogDescription>
              </DialogHeader>

              <div className="flex flex-col gap-3">
                <Button
                  onClick={handleCloseForgotPasswordModal}
                  className="bg-purple-600 hover:bg-purple-700 text-white"
                >
                  Tutup
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setEmailSent(false);
                    resetForgotForm();
                  }}
                  className="border-gray-600 text-white hover:bg-gray-700"
                >
                  Kirim Ulang
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
