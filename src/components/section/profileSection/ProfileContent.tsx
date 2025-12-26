"use client";

import { useState, useEffect } from "react";
import { useSession, signIn } from "@/lib/auth-client";
import { usePathname } from "next/navigation";
import { useSearchParams } from "next/navigation";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { User, Mail, Phone, Edit2, Save, X, Lock, Eye, EyeOff, AlertCircle, CheckCircle2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import CountryPhoneInput from "@/components/section/register/CountryPhoneInput";

const ProfileSchema = z.object({
  name: z.string().min(1, "Nama wajib diisi").max(100, "Nama terlalu panjang"),
  phone: z.string().optional(),
});

// Schema that makes currentPassword optional (will be validated on server)
const ChangePasswordSchema = z.object({
  currentPassword: z.string().optional(),
  newPassword: z.string().min(8, "Kata sandi baru minimal 8 karakter"),
  confirmPassword: z.string().min(1, "Konfirmasi kata sandi wajib diisi"),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Kata sandi baru tidak cocok",
  path: ["confirmPassword"],
});

type ProfileFormData = z.infer<typeof ProfileSchema>;
type ChangePasswordFormData = z.infer<typeof ChangePasswordSchema>;

export default function ProfileContent() {
  const { data: session, isPending } = useSession();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [userData, setUserData] = useState<{
    name: string | null;
    phone: string | null;
    image: string | null;
    hasPassword?: boolean;
    isOAuthOnly?: boolean;
    emailVerified?: boolean | null;
    hasGoogleAccount?: boolean;
  } | null>(null);
  const [hasShownWelcomeToast, setHasShownWelcomeToast] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Track if component is mounted to avoid hydration mismatch
  useEffect(() => {
    setIsMounted(true);
  }, []);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<ProfileFormData>({
    resolver: zodResolver(ProfileSchema),
  });

  const {
    register: registerPassword,
    handleSubmit: handleSubmitPassword,
    formState: { errors: passwordErrors },
    reset: resetPassword,
  } = useForm<ChangePasswordFormData>({
    resolver: zodResolver(ChangePasswordSchema),
  });

  const phoneValue = watch("phone");

  // Fetch user data from database to get phone number
  useEffect(() => {
    if (session?.user) {
      // Check if user just logged in (from query params)
      const fromLogin = searchParams?.get("from") === "login";
      const fromGoogle = searchParams?.get("from") === "google";
      const verified = searchParams?.get("verified") === "true";
      const googleLinked = searchParams?.get("google_linked") === "true";
      const oauthError = searchParams?.get("error");
      
      // Check for OAuth account linking error
      if (oauthError === "OAuthAccountNotLinked" && !hasShownWelcomeToast) {
        toast.error("Akun Google Sudah Terhubung", {
          description: "Akun Google ini sudah terhubung dengan akun lain. Tidak dapat menghubungkan.",
        });
        setHasShownWelcomeToast(true);
        // Remove error from URL
        const newUrl = new URL(window.location.href);
        newUrl.searchParams.delete("error");
        newUrl.searchParams.delete("google_linked");
        window.history.replaceState({}, "", newUrl.toString());
      } else if (googleLinked && !oauthError && !hasShownWelcomeToast) {
        toast.success("Akun Google Terhubung", {
          description: "Akun Google Anda berhasil dihubungkan! Anda sekarang bisa login dengan Google.",
        });
        setHasShownWelcomeToast(true);
        // Refresh user data to get updated hasGoogleAccount status
        fetch("/api/user/profile")
          .then((res) => res.json())
          .then((data) => {
            if (data.success) {
              setUserData({
                name: data.user.name,
                phone: data.user.phone,
                image: data.user.image,
                hasPassword: data.user.hasPassword,
                isOAuthOnly: data.user.isOAuthOnly,
                emailVerified: data.user.emailVerified,
                hasGoogleAccount: data.user.hasGoogleAccount,
              });
            }
          });
      } else if (verified && !hasShownWelcomeToast) {
        toast.success("Email Terverifikasi", {
          description: "Email Anda berhasil diverifikasi! Akun Anda sekarang aktif.",
        });
        setHasShownWelcomeToast(true);
        // Refresh user data to get updated emailVerified status
        fetch("/api/user/profile")
          .then((res) => res.json())
          .then((data) => {
            if (data.success) {
              setUserData({
                name: data.user.name,
                phone: data.user.phone,
                image: data.user.image,
                hasPassword: data.user.hasPassword,
                isOAuthOnly: data.user.isOAuthOnly,
                emailVerified: data.user.emailVerified,
                hasGoogleAccount: data.user.hasGoogleAccount,
              });
            }
          });
      } else if ((fromLogin || fromGoogle) && !hasShownWelcomeToast) {
        if (fromGoogle) {
          toast.success("Login Google Berhasil", {
            description: "Selamat datang! Akun Google Anda berhasil terhubung.",
          });
        } else {
          toast.success("Selamat Datang", {
            description: "Anda berhasil masuk ke akun Anda.",
          });
        }
        setHasShownWelcomeToast(true);
      }

      fetch("/api/user/profile")
        .then((res) => res.json())
        .then((data) => {
          if (data.success) {
            setUserData({
              name: data.user.name,
              phone: data.user.phone,
              image: data.user.image,
              hasPassword: data.user.hasPassword,
              isOAuthOnly: data.user.isOAuthOnly,
              emailVerified: data.user.emailVerified,
              hasGoogleAccount: data.user.hasGoogleAccount,
            });
            setValue("name", data.user.name || "");
            setValue("phone", data.user.phone || "");
          }
        })
        .catch(() => {
          // Fallback to session data
          setUserData({
            name: session.user.name || null,
            phone: null,
            image: session.user.image || null,
          });
          setValue("name", session.user.name || "");
        });
    }
  }, [session, setValue, searchParams, hasShownWelcomeToast]);

  const onSubmit = async (data: ProfileFormData) => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/user/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok) {
        toast.error("Gagal", {
          description: result.message || "Gagal memperbarui profil",
        });
        return;
      }

      // BetterAuth automatically refreshes session, no need to manually update
      
      // Refresh full user data to get all fields including emailVerified
      const profileResponse = await fetch("/api/user/profile");
      const profileData = await profileResponse.json();
      if (profileData.success) {
        setUserData({
          name: profileData.user.name,
          phone: profileData.user.phone,
          image: profileData.user.image,
          hasPassword: profileData.user.hasPassword,
          isOAuthOnly: profileData.user.isOAuthOnly,
          emailVerified: profileData.user.emailVerified,
          hasGoogleAccount: profileData.user.hasGoogleAccount,
        });
      } else {
        // Fallback to result data if profile fetch fails
        setUserData({
          name: result.user.name,
          phone: result.user.phone,
          image: result.user.image,
          emailVerified: (result.user as any).emailVerified ?? userData?.emailVerified,
        });
      }

      setIsEditing(false);
      toast.success("Profil Diperbarui", {
        description: "Perubahan profil Anda berhasil disimpan!",
      });
    } catch (err) {
      toast.error("Gagal Memperbarui", {
        description: "Terjadi kesalahan saat memperbarui profil. Silakan coba lagi.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const onPasswordSubmit = async (data: ChangePasswordFormData) => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/user/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok) {
        toast.error("Gagal Mengubah Kata Sandi", {
          description: result.message || "Terjadi kesalahan saat mengubah kata sandi.",
        });
        return;
      }

      setIsChangingPassword(false);
      resetPassword();
      
      // Refresh user data to update hasPassword status
      const profileResponse = await fetch("/api/user/profile");
      const profileData = await profileResponse.json();
      if (profileData.success) {
        setUserData({
          name: profileData.user.name,
          phone: profileData.user.phone,
          image: profileData.user.image,
          hasPassword: profileData.user.hasPassword,
          isOAuthOnly: profileData.user.isOAuthOnly,
          emailVerified: profileData.user.emailVerified,
          hasGoogleAccount: profileData.user.hasGoogleAccount,
        });
      }
      
      toast.success(userData?.hasPassword ? "Kata Sandi Diubah" : "Kata Sandi Diatur", {
        description: userData?.hasPassword 
          ? "Kata sandi Anda berhasil diubah!" 
          : "Kata sandi Anda berhasil diatur! Anda sekarang bisa login dengan email dan password.",
      });
    } catch (err) {
      toast.error("Gagal Mengubah Kata Sandi", {
        description: "Terjadi kesalahan saat mengubah kata sandi. Silakan coba lagi.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Show loading only after mount to avoid hydration mismatch
  if (!isMounted || isPending) {
    return (
      <div className="mx-auto max-w-7xl mb-10">
        <div className="bg-card rounded-lg p-8">
          <div className="flex flex-col items-center md:flex-row md:items-start gap-8">
            <div className="flex flex-col items-center">
              <div className="h-32 w-32 rounded-full bg-gray-700 animate-pulse" />
            </div>
            <div className="flex-1 space-y-4">
              <div className="h-8 bg-gray-700 rounded animate-pulse w-1/2" />
              <div className="h-4 bg-gray-700 rounded animate-pulse w-3/4" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="mx-auto max-w-7xl mb-10">
        <div className="bg-card rounded-lg p-8">
          <div className="text-center text-white">Not authenticated</div>
        </div>
      </div>
    );
  }

  const user = session.user;
  const displayName = userData?.name || user.name || "User";
  const displayPhone = userData?.phone || "Tidak diisi";
  const displayImage = userData?.image || user.image || undefined;

  return (
    <div className="mx-auto max-w-7xl mb-10">
      {/* Email Verification Banner */}
      {userData && !userData.emailVerified && (
        <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4 mb-6 flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-yellow-400 mt-0.5 flex-shrink-0" />
          <div className="flex-1">
            <h3 className="text-white font-semibold mb-1">Verifikasi Email Diperlukan</h3>
            <p className="text-gray-300 text-sm mb-3">
              Silakan verifikasi email Anda untuk mengaktifkan akun. Klik tombol di bawah untuk mengirim email verifikasi ke <span className="font-medium text-white">{user.email}</span>
            </p>
            <div className="flex gap-2">
              <Button
                size="sm"
                onClick={async () => {
                  try {
                    setIsLoading(true);
                    const loadingToast = toast.loading("Mengirim email verifikasi...", {
                      description: "Mohon tunggu sebentar...",
                    });
                    const response = await fetch("/api/user/resend-verification", {
                      method: "POST",
                    });
                    const data = await response.json();
                    toast.dismiss(loadingToast);
                    if (response.ok) {
                      toast.success("Email Verifikasi Dikirim", {
                        description: "Silakan cek inbox email Anda untuk verifikasi. Link berlaku selama 24 jam.",
                      });
                    } else {
                      toast.error("Gagal Mengirim Email", {
                        description: data.message || "Terjadi kesalahan. Silakan coba lagi.",
                      });
                    }
                  } catch (err) {
                    toast.error("Gagal Mengirim Email", {
                      description: "Terjadi kesalahan. Silakan coba lagi.",
                    });
                  } finally {
                    setIsLoading(false);
                  }
                }}
                disabled={isLoading}
                className="bg-yellow-500 hover:bg-yellow-600 text-white"
              >
                {isLoading ? "Mengirim..." : "Kirim Email Verifikasi"}
              </Button>
            </div>
          </div>
        </div>
      )}

      <div className="bg-card rounded-lg p-8">
        <div className="flex flex-col items-center md:flex-row md:items-start gap-8">
          {/* Avatar Section */}
          <div className="flex flex-col items-center">
            <Avatar className="h-32 w-32 border-4 border-gray-700">
              <AvatarImage
                src={displayImage}
                alt={displayName}
                className="object-cover"
              />
              <AvatarFallback className="bg-gray-700 text-white text-2xl">
                {displayName
                  .split(" ")
                  .map((n) => n[0])
                  .join("")
                  .toUpperCase()
                  .slice(0, 2)}
              </AvatarFallback>
            </Avatar>
            <div className="mt-4 text-center">
              <h3 className="text-xl font-semibold text-white">{displayName}</h3>
              <p className="text-sm text-gray-400 mt-1">{user.email}</p>
            </div>
          </div>

          {/* Profile Information */}
          <div className="flex-1 space-y-4">
            <Card className="bg-gray-800/50 border-gray-700 p-6">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-lg font-semibold text-white">
                  Informasi Profil
                </h4>
                {!isEditing && (
                  <Button
                    onClick={() => setIsEditing(true)}
                    variant="ghost"
                    size="sm"
                    className="text-white hover:text-white hover:bg-gray-700"
                  >
                    <Edit2 className="h-4 w-4 mr-2" />
                    Edit
                  </Button>
                )}
              </div>

              {isEditing ? (
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                  {/* Name Field */}
                  <div>
                    <Label htmlFor="name" className="text-sm text-gray-400 mb-2 block">
                      Nama Lengkap
                    </Label>
                    <Input
                      id="name"
                      {...register("name")}
                      className="bg-gray-700/50 border-gray-600 text-white placeholder:text-gray-400"
                      placeholder="Masukkan nama lengkap"
                    />
                    {errors.name && (
                      <p className="text-xs text-red-400 mt-1">
                        {errors.name.message}
                      </p>
                    )}
                  </div>

                  {/* Phone Field */}
                  <div>
                    <Label className="text-sm text-gray-400 mb-2 block">
                      Nomor Telepon
                    </Label>
                    <CountryPhoneInput
                      value={phoneValue || ""}
                      onChange={(val) => setValue("phone", val)}
                    />
                    {errors.phone && (
                      <p className="text-xs text-red-400 mt-1">
                        {errors.phone.message}
                      </p>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-3 pt-4">
                    <Button
                      type="submit"
                      disabled={isLoading}
                      className="bg-primary hover:bg-primary/90"
                    >
                      <Save className="h-4 w-4 mr-2" />
                      {isLoading ? "Menyimpan..." : "Simpan"}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setIsEditing(false);
                        // Reset form to original values
                        setValue("name", userData?.name || "");
                        setValue("phone", userData?.phone || "");
                      }}
                      className="border-gray-600 text-white hover:bg-gray-700"
                    >
                      <X className="h-4 w-4 mr-2" />
                      Batal
                    </Button>
                  </div>
                </form>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="bg-gray-700/50 p-2 rounded-lg">
                      <User className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-400">Nama</p>
                      <p className="text-white font-medium">{displayName}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="bg-gray-700/50 p-2 rounded-lg">
                      <Mail className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-400">Email</p>
                      <p className="text-white font-medium">{user.email}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="bg-gray-700/50 p-2 rounded-lg">
                      <Phone className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-400">Nomor Telepon</p>
                      <p className="text-white font-medium">{displayPhone}</p>
                    </div>
                  </div>
                </div>
              )}
            </Card>

            {/* Account Security */}
            <Card className="bg-gray-800/50 border-gray-700 p-6">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-lg font-semibold text-white">
                  Keamanan Akun
                </h4>
                {!isChangingPassword && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsChangingPassword(true)}
                    className="border-gray-600 text-white hover:bg-gray-700"
                  >
                    <Lock className="h-4 w-4 mr-2" />
                    {userData?.hasPassword ? "Ubah Kata Sandi" : "Atur Kata Sandi"}
                  </Button>
                )}
              </div>
              
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-white font-medium">Email Terverifikasi</p>
                    <p className="text-sm text-gray-400">
                      {userData?.emailVerified ? "Email sudah terverifikasi" : "Email belum terverifikasi"}
                    </p>
                  </div>
                  <div className={`h-2 w-2 rounded-full ${userData?.emailVerified ? "bg-green-500" : "bg-yellow-500"}`}></div>
                </div>

                {userData?.isOAuthOnly && (
                  <div className="flex items-center justify-between pt-2 border-t border-gray-700">
                    <div>
                      <p className="text-white font-medium">Akun Google</p>
                      <p className="text-sm text-gray-400">
                        Akun Google sudah terhubung
                      </p>
                    </div>
                    <div className="h-2 w-2 rounded-full bg-green-500"></div>
                  </div>
                )}

                {/* Google Account Connection */}
                {userData?.hasPassword && !userData?.hasGoogleAccount && (
                  <div className="flex items-center justify-between pt-2 border-t border-gray-700">
                    <div>
                      <p className="text-white font-medium">Akun Google</p>
                      <p className="text-sm text-gray-400">
                        Hubungkan akun Google untuk login lebih mudah
                      </p>
                    </div>
                    <Button
                      type="button"
                      onClick={async () => {
                        const locale = pathname?.split("/")[1] ?? "id";
                        const loadingToast = toast.loading("Menghubungkan akun Google...", {
                          description: "Mengarahkan ke Google...",
                        });
                        try {
                          await signIn.social({
                            provider: "google",
                            callbackURL: `/${locale}/profile?google_linked=true`,
                          });
                        } catch (error) {
                          toast.dismiss(loadingToast);
                          toast.error("Gagal Menghubungkan Google", {
                            description: "Terjadi kesalahan saat menghubungkan akun Google.",
                          });
                        }
                      }}
                      className="bg-white text-gray-700 hover:bg-gray-100 border border-gray-300"
                      size="sm"
                    >
                      <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24">
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
                      Hubungkan Google
                    </Button>
                  </div>
                )}

                {userData?.hasPassword && userData?.hasGoogleAccount && (
                  <div className="flex items-center justify-between pt-2 border-t border-gray-700">
                    <div>
                      <p className="text-white font-medium">Akun Google</p>
                      <p className="text-sm text-gray-400">
                        Akun Google sudah terhubung
                      </p>
                    </div>
                    <div className="h-2 w-2 rounded-full bg-green-500"></div>
                  </div>
                )}

                {isChangingPassword && (
                  <form onSubmit={handleSubmitPassword(onPasswordSubmit)} className="space-y-4 pt-4 border-t border-gray-700">
                    {userData?.hasPassword && (
                      <div>
                        <Label htmlFor="currentPassword" className="text-sm text-gray-400 mb-2 block">
                          Kata Sandi Saat Ini
                        </Label>
                        <div className="relative">
                          <Input
                            id="currentPassword"
                            type={showCurrentPassword ? "text" : "password"}
                            {...registerPassword("currentPassword")}
                            className="bg-gray-700/50 border-gray-600 text-white placeholder:text-gray-400 pr-10"
                            placeholder="Masukkan kata sandi saat ini"
                          />
                          <button
                            type="button"
                            onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                            className="absolute top-1/2 right-3 -translate-y-1/2 text-gray-400 hover:text-white"
                          >
                            {showCurrentPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </button>
                        </div>
                        {passwordErrors.currentPassword && (
                          <p className="text-xs text-red-400 mt-1">
                            {passwordErrors.currentPassword.message}
                          </p>
                        )}
                      </div>
                    )}
                    {!userData?.hasPassword && (
                      <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-3 mb-4">
                        <p className="text-sm text-blue-300">
                          Anda belum memiliki kata sandi. Atur kata sandi untuk dapat login dengan email dan password.
                        </p>
                      </div>
                    )}

                    <div>
                      <Label htmlFor="newPassword" className="text-sm text-gray-400 mb-2 block">
                        Kata Sandi Baru
                      </Label>
                      <div className="relative">
                        <Input
                          id="newPassword"
                          type={showNewPassword ? "text" : "password"}
                          {...registerPassword("newPassword")}
                          className="bg-gray-700/50 border-gray-600 text-white placeholder:text-gray-400 pr-10"
                          placeholder="Masukkan kata sandi baru (min. 8 karakter)"
                        />
                        <button
                          type="button"
                          onClick={() => setShowNewPassword(!showNewPassword)}
                          className="absolute top-1/2 right-3 -translate-y-1/2 text-gray-400 hover:text-white"
                        >
                          {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                      {passwordErrors.newPassword && (
                        <p className="text-xs text-red-400 mt-1">
                          {passwordErrors.newPassword.message}
                        </p>
                      )}
                    </div>

                    <div>
                      <Label htmlFor="confirmPassword" className="text-sm text-gray-400 mb-2 block">
                        Konfirmasi Kata Sandi Baru
                      </Label>
                      <div className="relative">
                        <Input
                          id="confirmPassword"
                          type={showConfirmPassword ? "text" : "password"}
                          {...registerPassword("confirmPassword")}
                          className="bg-gray-700/50 border-gray-600 text-white placeholder:text-gray-400 pr-10"
                          placeholder="Masukkan ulang kata sandi baru"
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          className="absolute top-1/2 right-3 -translate-y-1/2 text-gray-400 hover:text-white"
                        >
                          {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                      {passwordErrors.confirmPassword && (
                        <p className="text-xs text-red-400 mt-1">
                          {passwordErrors.confirmPassword.message}
                        </p>
                      )}
                    </div>

                    <div className="flex gap-3 pt-2">
                      <Button
                        type="submit"
                        disabled={isLoading}
                        className="bg-primary hover:bg-primary/90"
                      >
                        <Save className="h-4 w-4 mr-2" />
                        {isLoading ? "Menyimpan..." : "Simpan Kata Sandi"}
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                          setIsChangingPassword(false);
                          resetPassword();
                        }}
                        className="border-gray-600 text-white hover:bg-gray-700"
                      >
                        <X className="h-4 w-4 mr-2" />
                        Batal
                      </Button>
                    </div>
                  </form>
                )}
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
