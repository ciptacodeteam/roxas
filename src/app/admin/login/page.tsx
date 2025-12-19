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
import { signIn } from "next-auth/react";
import { useSession } from "next-auth/react";

// ⚡ Validation Schema
const LoginSchema = z.object({
  email: z.string().email("Invalid email"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export default function AdminLoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const { data: session, status } = useSession();

  // Check if user is already logged in
  useEffect(() => {
    if (status === "authenticated" && session?.user.role === "ADMIN") {
      router.replace('/admin');
    }
  }, [session, status, router]);

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
    setError(null);
    try {
      const result = await signIn("credentials", {
        email: data.email,
        password: data.password,
        redirect: false,
      });

      if (result?.error) {
        setError("Invalid email or password");
        toast.error("Login failed", {
          description: "Invalid email or password",
        });
      } else if (result?.ok) {
        // Middleware will check if user is admin and redirect accordingly
        toast.success("Login successful", {
          description: "Redirecting to admin dashboard...",
        });
        router.push('/admin');
        router.refresh();
      }
    } catch (err) {
      setError("An error occurred. Please try again.");
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

                  {/* Divider */}
                  <div className="relative my-6">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-gray-400"></div>
                    </div>
                    <div className="relative flex justify-center text-sm">
                      <span className="px-2 bg-transparent text-white">or</span>
                    </div>
                  </div>

                  {/* Google Sign In */}
                  <Button
                    type="button"
                    onClick={() => signIn("google", { callbackUrl: "/admin" })}
                    className="bg-white text-gray-700 hover:bg-gray-100 mt-2 w-full border border-gray-300"
                  >
                    <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
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
                    Sign in with Google
                  </Button>

                </div>
              </div>
            </div>

          </div>
        </div>
      </section>
    </>
  );
}
