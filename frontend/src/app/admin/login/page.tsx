/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import img4 from "public/img/img-4.webp";
import logo from "public/img/logo.webp";

import { useState, useEffect } from "react";
import { Eye, EyeOff, Mail, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

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
import { zodResolver } from "@hookform/resolvers/zod";
import { useAuth, useLogin, adminLoginSchema, type AdminLoginFormData } from "@/lib/auth";
import { z } from "zod";
import { useRequestPasswordReset } from "@/lib/password-reset";

const ForgotPasswordSchema = z.object({
  email: z.string().email("Email tidak valid"),
});

type ForgotPasswordFormData = z.infer<typeof ForgotPasswordSchema>;

export default function AdminLoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [showForgotPasswordModal, setShowForgotPasswordModal] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
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

  // Forgot password form (must be called before early returns)
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

  // Submit Form
  const onSubmit = (data: AdminLoginFormData) => {
    login({
      email: data.email,
      password: data.password,
    });
  };

  const onSubmitForgotPassword = (data: ForgotPasswordFormData) => {
    requestReset(data);
  };

  const handleCloseForgotPasswordModal = () => {
    setShowForgotPasswordModal(false);
    setEmailSent(false);
    resetForgotForm();
  };

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

                      <button
                        type="button"
                        onClick={() => setShowForgotPasswordModal(true)}
                        className="mt-1 flex justify-end text-sm text-purple-400 hover:text-purple-300 transition-colors"
                      >
                        Lupa password?
                      </button>
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

      {/* Forgot Password Modal */}
      <Dialog open={showForgotPasswordModal} onOpenChange={handleCloseForgotPasswordModal}>
        <DialogContent className="sm:max-w-md bg-card border-gray-700">
          {!emailSent ? (
            <>
              <DialogHeader>
                <DialogTitle className="text-white text-xl">Admin - Lupa Password?</DialogTitle>
                <DialogDescription className="text-gray-300">
                  Masukkan email admin Anda dan kami akan mengirimkan link untuk reset password.
                </DialogDescription>
              </DialogHeader>

              <form onSubmit={handleSubmitForgot(onSubmitForgotPassword)} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="forgot-email" className="text-sm text-white">Email Admin</Label>
                  <Input
                    id="forgot-email"
                    type="email"
                    placeholder="Enter your admin email"
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
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={isResetting}
                    className="flex-1 bg-purple-600 hover:bg-purple-700 text-white"
                  >
                    {isResetting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Sending...
                      </>
                    ) : (
                      "Send Email"
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
                <DialogTitle className="text-center text-white text-xl">Email Sent!</DialogTitle>
                <DialogDescription className="text-center text-gray-300">
                  We've sent a password reset link to your email. Please check your inbox or spam folder.
                </DialogDescription>
              </DialogHeader>

              <div className="flex flex-col gap-3">
                <Button
                  onClick={handleCloseForgotPasswordModal}
                  className="bg-purple-600 hover:bg-purple-700 text-white"
                >
                  Close
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setEmailSent(false);
                    resetForgotForm();
                  }}
                  className="border-gray-600 text-white hover:bg-gray-700"
                >
                  Resend Email
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
