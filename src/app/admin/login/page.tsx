/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import img4 from "public/img/img-4.webp";
import logo from "public/img/logo.webp";

import { useEffect, useState } from "react";
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

// ⚡ Validation Schema
const LoginSchema = z.object({
  email: z.string().email("Invalid email"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export default function AdminLoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();

  // Check if user is already logged in
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch('/api/admin/check', {
          method: 'GET',
          credentials: 'include',
        });

        const result = await response.json();

        if (result.authenticated) {
          // User is already logged in, redirect to dashboard
          router.replace('/admin');
        }
      } catch (error) {
        // Ignore errors, let user stay on login page
        console.error('Auth check error:', error);
      }
    };

    checkAuth();
  }, [router]);

  // ⚡ Connect form + validation
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(LoginSchema),
  });

  // ⚡ Submit Form
  const onSubmit = async (data: any) => {
    try {
      const response = await fetch('/api/admin/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (result.success) {
        toast.success("Login successful", {
          description: "Redirecting to admin dashboard...",
        });
        router.push('/admin');
        router.refresh();
      } else {
        toast.error("Login failed", {
          description: result.message || 'Invalid email or password',
        });
      }
    } catch (err) {
      toast.error("An error occurred", {
        description: "Please try again later.",
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
                        className="mt-1 flex justify-end text-sm text-blue-400"
                      >
                        Forgot your password?
                      </Link>
                    </div>

                    {/* Remember Me */}
                    <div className="mt-3 flex items-center gap-3">
                      <Checkbox id="remember" />
                      <Label htmlFor="remember" className="text-sm text-white">
                        Remember me
                      </Label>
                    </div>

                    {/* Submit */}
                    <Button
                      type="submit"
                      disabled={isSubmitting}
                      className="bg-primary mt-6 w-full cursor-pointer text-white"
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
