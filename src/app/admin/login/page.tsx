/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import img4 from "public/img/img-4.webp";
import logo from "public/img/logo.webp";

import { useState, useEffect } from "react";
import { Eye, EyeOff } from "lucide-react";
import { useRouter } from "next/navigation";

import Image from "next/image";
import { Input } from "@/components/ui/input";
import { Label } from "@radix-ui/react-label";
import { Checkbox } from "@/components/ui/checkbox";
import Link from "next/link";
import { Button } from "@/components/ui/button";

import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { signIn, useSession } from "@/lib/auth-client";

// ⚡ Validation Schema
const LoginSchema = z.object({
  email: z.string().email("Invalid email"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export default function AdminLoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const { data: session, isPending } = useSession();

  // ⚡ Connect form + validation (must be called before any early returns)
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(LoginSchema),
  });

  // Check if user is already logged in and verify role
  useEffect(() => {
    const checkRoleAndRedirect = async () => {
      if (session?.user) {
        try {
          const roleResponse = await fetch("/api/auth/check-role");
          const roleData = await roleResponse.json();

          if (roleData.success && roleData.role === "ADMIN") {
            // Admin user - redirect to admin dashboard
            window.location.href = '/admin';
            return;
          } else if (roleData.success && roleData.role !== "ADMIN") {
            // Regular user trying to access admin login - sign out and redirect
            const { signOut } = await import("@/lib/auth-client");
            await signOut();
            setError("Access denied");
            toast.error("Access Denied", {
              description: "Only admin accounts can access this page. Please use the public login page.",
            });
            // Redirect to home after a delay
            setTimeout(() => {
              router.push('/');
            }, 2000);
          }
        } catch (error) {
          console.error("Role check failed:", error);
        }
      }
    };

    checkRoleAndRedirect();
  }, [session, router]);

  // Show loading while checking session
  if (isPending) {
    return (
      <div className="h-screen bg-[url(/img/img-2.webp)] bg-cover bg-no-repeat flex items-center justify-center">
        <div className="text-white text-lg">Loading...</div>
      </div>
    );
  }

  // Don't render login form if already authenticated (will redirect)
  if (session?.user && (session.user as any).role === "ADMIN") {
    return null;
  }

  // ⚡ Submit Form
  const onSubmit = async (data: any) => {
    setError(null);
    const loadingToast = toast.loading("Processing login...", {
      description: "Please wait...",
    });

    try {
      console.log('🔐 Attempting login for:', data.email);
      const result = await signIn.email({
        email: data.email,
        password: data.password,
      });

      console.log('📊 Login result:', result);

      // Dismiss loading toast
      toast.dismiss(loadingToast);

      if (result.error) {
        console.error('❌ Login error:', result.error);
        setError("Invalid email or password");
        toast.error("Login Failed", {
          description: result.error.message || "Invalid email or password. Please try again.",
        });
      } else {
        console.log('✅ Login successful');
        // Success! Show toast and redirect immediately
        toast.success("Login Successful", {
          description: "Redirecting to admin dashboard...",
        });
        
        // Optimistic redirect - redirect immediately
        // Middleware will validate admin role and redirect back if not admin
        window.location.href = '/admin';
        
        // Background validation for extra security (won't block redirect)
        fetch("/api/auth/check-role")
          .then(res => res.json())
          .then(roleData => {
            if (!roleData.success || roleData.role !== "ADMIN") {
              // Non-admin detected - middleware will handle redirect
              console.log("Non-admin detected on admin login - middleware will redirect");
            }
          })
          .catch(err => {
            // Middleware will handle authentication
            console.error("Background role check failed:", err);
          });
      }
    } catch (err) {
      // Dismiss loading toast
      toast.dismiss(loadingToast);
      setError("An error occurred. Please try again.");
      toast.error("Login Failed", {
        description: "An error occurred during login. Please try again.",
      });
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
                      Admin Login
                    </h1>
                    <p className="mt-1 font-light text-white">
                      Sign in to access the admin dashboard.
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
                        placeholder="Enter your email"
                        {...register("email")}
                        className={`bg-foreground w-full border-0 p-5 text-white placeholder:text-gray-400 ${
                          errors.email ? "border border-red-500" : ""
                        }`}
                      />

                      {errors.email && (
                        <p className="text-red-400 text-sm mt-1">
                          {errors.email.message as string}
                        </p>
                      )}
                      {error && !errors.email && (
                        <p className="text-red-400 text-sm mt-1">{error}</p>
                      )}
                    </div>

                    {/* PASSWORD */}
                    <div className="mt-6 grid w-full gap-1">
                      <Label htmlFor="password" className="text-sm text-white">
                        Password
                      </Label>

                      <div className="relative">
                        <Input
                          type={showPassword ? "text" : "password"}
                          id="password"
                          placeholder="Enter your password"
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
                          {errors.password.message as string}
                        </p>
                      )}

                      <Link
                        href="#"
                        className="mt-1 flex justify-end text-sm text-blue-400 hover:text-blue-300 transition-colors"
                      >
                        Forgot your password?
                      </Link>
                    </div>

                    {/* Remember Me */}
                    <div className="mt-3 flex items-center gap-3">
                      <Checkbox id="terms" />
                      <Label htmlFor="terms" className="text-sm text-white">
                        Remember me
                      </Label>
                    </div>

                    {/* Submit */}
                    <Button
                      type="submit"
                      disabled={isSubmitting}
                      className="mt-6 w-full cursor-pointer text-white"
                      style={{
                        backgroundColor: '#ff6b6b',
                      }}
                      onMouseEnter={(e) => {
                        if (!isSubmitting) {
                          e.currentTarget.style.backgroundColor = '#ff5252';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!isSubmitting) {
                          e.currentTarget.style.backgroundColor = '#ff6b6b';
                        }
                      }}
                    >
                      {isSubmitting ? "Processing..." : "Sign In"}
                    </Button>
                  </form>

                </div>
              </div>
            </div>

          </div>
        </div>
      </section>
    </>
  );
}
