/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import img4 from "public/img/img-4.webp";
import logo from "public/img/logo1.webp";

import { useState, useEffect } from "react";
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
import { signIn, signOut, useSession } from "@/lib/auth-client";
import { useRouter, usePathname } from "next/navigation";
import { toast } from "sonner";

// ⚡ Validation Schema
const LoginSchema = z.object({
  email: z.string().email("Email tidak valid"),
  password: z.string().min(8, "Kata sandi minimal 8 karakter"),
});

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const pathname = usePathname();
  const { data: session, isPending } = useSession();
  
  // ⚡ Connect form + validation (must be called before any early returns)
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(LoginSchema),
  });

  // Redirect if already logged in and check role
  useEffect(() => {
    const checkRoleAndRedirect = async () => {
      if (session?.user) {
        // Check if user is admin
        try {
          const roleResponse = await fetch("/api/auth/check-role");
          const roleData = await roleResponse.json();

          if (roleData.success && roleData.role === "ADMIN") {
            // Admin trying to access public login - sign out and show error
            await signOut();
            setError("Akses ditolak");
            toast.error("Login Gagal", {
              description: "Akun admin tidak dapat login melalui halaman ini. Silakan gunakan halaman admin login.",
            });
            return;
          }

          // Regular user - proceed with redirect
          const locale = pathname?.split("/")[1] ?? "id";
          router.replace(`/${locale}/profile`);
        } catch (error) {
          console.error("Role check failed:", error);
          // If role check fails, still redirect but log the error
          const locale = pathname?.split("/")[1] ?? "id";
          router.replace(`/${locale}/profile`);
        }
      }
    };

    checkRoleAndRedirect();
  }, [session, router, pathname]);

  // Check for OAuth errors and registration success message
  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    
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
  }, [router, pathname]);

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

  // ⚡ Submit Form
  const onSubmit = async (data: any) => {
    setError(null);
    const loadingToast = toast.loading("Memproses login...", {
      description: "Mohon tunggu sebentar...",
    });

    try {
      const result = await signIn.email({
        email: data.email,
        password: data.password,
      });

      // Dismiss loading toast
      toast.dismiss(loadingToast);

      if (result.error) {
        setError("Email atau kata sandi tidak valid");
        toast.error("Login Gagal", {
          description: result.error.message || "Email atau kata sandi tidak valid. Silakan coba lagi.",
        });
      } else {
        // Success! Show toast and redirect immediately
        toast.success("Login Berhasil", {
          description: "Mengarahkan ke profil Anda...",
        });
        
        const locale = pathname.split("/")[1] ?? "id";
        
        // Optimistic redirect - redirect immediately, validate role in background
        window.location.href = `/${locale}/profile?from=login`;
        
        // Background validation (won't block redirect)
        // Check if admin tried to use public login - middleware will handle redirect if needed
        fetch("/api/auth/check-role")
          .then(res => res.json())
          .then(roleData => {
            if (roleData.success && roleData.role === "ADMIN") {
              // Admin detected - sign out will happen via middleware redirect
              console.log("Admin detected on public login - middleware will redirect");
            }
          })
          .catch(err => {
            // Ignore errors - middleware will handle authentication
            console.error("Background role check failed:", err);
          });
      }
    } catch (err) {
      // Dismiss loading toast
      toast.dismiss(loadingToast);
      setError("Terjadi kesalahan saat login");
      toast.error("Login Gagal", {
        description: "Terjadi kesalahan saat login. Silakan coba lagi.",
      });
    }
  };

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
                    className="w-[500px] rounded-xl bg-cover bg-no-repeat lg:block hidden"
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

                      <Link
                        href={`/${pathname?.split("/")[1] || "id"}/forgot-password`}
                        className="mt-1 flex justify-end text-sm text-blue-400 hover:text-blue-300 transition-colors"
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

                    {/* Submit and Google Sign In - Same Row */}
                    <div className="mt-6 lg:flex lg:flex-row flex flex-col gap-3">
                      <Button
                        type="submit"
                        disabled={isSubmitting}
                        className="bg-primary flex-1 cursor-pointer text-white"
                      >
                        {isSubmitting ? "Memproses..." : "Masuk"}
                      </Button>

                      <Button
                        type="button"
                        onClick={async () => {
                          const locale = pathname.split("/")[1] ?? "id";
                          // Show loading toast briefly, but it will be dismissed when redirect happens
                          const loadingToast = toast.loading("Memproses login Google...", {
                            description: "Mengarahkan ke Google...",
                          });
                          try {
                            await signIn.social({
                              provider: "google",
                              callbackURL: `/${locale}/profile?from=google`,
                            });
                          } catch (error) {
                            toast.dismiss(loadingToast);
                            toast.error("Login Google Gagal", {
                              description: "Terjadi kesalahan saat login dengan Google.",
                            });
                          }
                        }}
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
    </>
  );
}
