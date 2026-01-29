/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import img4 from "public/img/img-4.webp";
import logo from "public/img/logo.webp";

import { useState, useEffect } from "react";
import { Eye, EyeOff } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import Image from "next/image";
import { Input } from "@/components/ui/input";
import { Label } from "@radix-ui/react-label";
import { Checkbox } from "@/components/ui/checkbox";
import Link from "next/link";
import { Button } from "@/components/ui/button";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAuth, useLogin, adminLoginSchema, type AdminLoginFormData } from "@/lib/auth";

export default function AdminLoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();
  const { user, isLoading: authLoading, isAdmin } = useAuth();
  const [hasCheckedInitialAuth, setHasCheckedInitialAuth] = useState(false);
  const { login, isLoading: loginLoading } = useLogin({
    isAdmin: true,
    redirectTo: "/admin",
  });

  // Form validation
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<AdminLoginFormData>({
    resolver: zodResolver(adminLoginSchema),
  });

  // Check authentication only once on initial load
  useEffect(() => {
    if (!authLoading && !hasCheckedInitialAuth) {
      setHasCheckedInitialAuth(true);
      
      // Redirect already logged-in admin users to dashboard
      if (user && isAdmin) {
        router.push('/admin');
      }
    }
  }, [authLoading, user, isAdmin, router, hasCheckedInitialAuth]);

  // Show loading while checking session
  if (authLoading) {
    return (
      <div className="h-screen bg-[url(/img/img-2.webp)] bg-cover bg-no-repeat flex items-center justify-center">
        <div className="text-white text-lg">Loading...</div>
      </div>
    );
  }

  // Don't render login form if admin user is already logged in
  // (useLogin will redirect them to /admin on successful login)
  if (user && isAdmin) {
    return null;
  }

  // Submit Form
  const onSubmit = (data: AdminLoginFormData) => {
    login({
      email: data.email,
      password: data.password,
    });
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

                    {/* Submit */}
                    <Button
                      type="submit"
                      disabled={loginLoading}
                      className="mt-6 w-full cursor-pointer text-white"
                      style={{
                        backgroundColor: '#ff6b6b',
                      }}
                      onMouseEnter={(e) => {
                        if (!loginLoading) {
                          e.currentTarget.style.backgroundColor = '#ff5252';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!loginLoading) {
                          e.currentTarget.style.backgroundColor = '#ff6b6b';
                        }
                      }}
                    >
                      {loginLoading ? "Processing..." : "Sign In"}
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
