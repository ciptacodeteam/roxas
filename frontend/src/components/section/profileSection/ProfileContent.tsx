/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth";
import { useProfile, useUpdateProfile, useChangePassword } from "@/lib/profile";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PhoneInputWithCountry } from "@/components/ui/phone-input-with-country";
import { User, Mail, Phone, Edit2, Save, X, Lock, Eye, EyeOff, Loader } from "lucide-react";
import { useForm, Controller } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";
import { useGoogleLogin } from "@react-oauth/google";

// ==================== VALIDATION SCHEMAS ====================

const ProfileSchema = z.object({
  full_name: z.string().min(1, "Nama wajib diisi").max(100, "Nama terlalu panjang"),
  contact_phone: z.string().optional(),
});

const ChangePasswordSchema = z.object({
  old_password: z.string().min(1, "Kata sandi lama wajib diisi"),
  new_password: z.string().min(8, "Kata sandi baru minimal 8 karakter"),
  confirm_password: z.string().min(1, "Konfirmasi kata sandi wajib diisi"),
}).refine((data) => data.new_password === data.confirm_password, {
  message: "Kata sandi baru tidak cocok",
  path: ["confirm_password"],
});

type ProfileFormData = z.infer<typeof ProfileSchema>;
type ChangePasswordFormData = z.infer<typeof ChangePasswordSchema>;

// ==================== COMPONENT ====================

export default function ProfileContent() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { session, isLoading: authLoading } = useAuth();
  
  const [isEditing, setIsEditing] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [hasShownWelcomeToast, setHasShownWelcomeToast] = useState(false);
  const [isConnectingGoogle, setIsConnectingGoogle] = useState(false);

  // Fetch profile data
  const { data: profile, isLoading: profileLoading, error: profileError, refetch } = useProfile({
    enabled: !!session?.user,
  });

  // Update profile mutation
  const updateProfileMutation = useUpdateProfile({
    onSuccess: (data) => {
      setIsEditing(false);
      // Refetch to ensure latest data
      refetch?.();
      toast.success("Profil Diperbarui", {
        description: "Perubahan profil Anda berhasil disimpan!",
      });
    },
    onError: (error) => {
      toast.error("Gagal Memperbarui", {
        description: error.message || "Terjadi kesalahan saat memperbarui profil.",
      });
    },
  });

  // Change password mutation
  const changePasswordMutation = useChangePassword({
    onSuccess: () => {
      setIsChangingPassword(false);
      resetPassword();
      toast.success("Kata Sandi Diubah", {
        description: "Kata sandi Anda berhasil diubah!",
      });
    },
    onError: (error) => {
      toast.error("Gagal Mengubah Kata Sandi", {
        description: error.message || "Terjadi kesalahan saat mengubah kata sandi.",
      });
    },
  });

  // Profile form
  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    control,
  } = useForm<ProfileFormData>({
    resolver: zodResolver(ProfileSchema),
  });

  // Password form
  const {
    register: registerPassword,
    handleSubmit: handleSubmitPassword,
    formState: { errors: passwordErrors },
    reset: resetPassword,
  } = useForm<ChangePasswordFormData>({
    resolver: zodResolver(ChangePasswordSchema),
  });

  // Show welcome toast on first load
  useEffect(() => {
    if (session?.user && !hasShownWelcomeToast) {
      const fromLogin = searchParams?.get("from") === "login";
      const fromGoogle = searchParams?.get("from") === "google";

      if (fromGoogle) {
        toast.success("Login Google Berhasil", {
          description: "Selamat datang! Akun Google Anda berhasil terhubung.",
        });
        setHasShownWelcomeToast(true);
      } else if (fromLogin) {
        toast.success("Selamat Datang", {
          description: "Anda berhasil masuk ke akun Anda.",
        });
        setHasShownWelcomeToast(true);
      }
    }
  }, [session, searchParams, hasShownWelcomeToast]);

  // Populate form when profile loads
  useEffect(() => {
    if (profile && !isEditing) {
      setValue("full_name", profile.full_name || "");
      setValue("contact_phone", profile.contact_phone || "");
    }
  }, [profile, setValue, isEditing]);

  // Redirect if not authenticated (but only after loading is complete)
  useEffect(() => {
    // Don't redirect while still loading
    if (authLoading || profileLoading) {
      return;
    }
    
    // Only redirect if we're sure there's no session
    if (!session?.user) {
      const locale = pathname.split("/")[1] ?? "id";
      router.replace(`/${locale}/login`);
    }
  }, [authLoading, profileLoading, session, router, pathname, profile]);

  // Form submit handlers
  const onSubmit = (data: ProfileFormData) => {
    updateProfileMutation.mutate(data);
  };

  const onPasswordSubmit = (data: ChangePasswordFormData) => {
    changePasswordMutation.mutate({
      old_password: data.old_password,
      new_password: data.new_password,
    });
  };

  const handleCancelEdit = () => {
    if (profile) {
      setValue("full_name", profile.full_name || "");
      setValue("contact_phone", profile.contact_phone || "");
    }
    setIsEditing(false);
  };

  const handleCancelPasswordChange = () => {
    resetPassword();
    setIsChangingPassword(false);
  };

  // Google login handler
  const googleLogin = useGoogleLogin({
    onSuccess: async (response) => {
      setIsConnectingGoogle(true);
      try {
        // Send the token to the backend to connect Google account
        const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_API_URL}/api/v1/auth/connect-google/`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem('access_token')}`,
          },
          body: JSON.stringify({
            access_token: response.access_token,
          }),
        });

        if (res.ok) {
          toast.success("Google Terhubung", {
            description: "Akun Google Anda berhasil terhubung ke akun Roxas Anda.",
          });
          // Refetch profile to get updated data
          refetch?.();
        } else {
          const error = await res.json();
          toast.error("Gagal Terhubung", {
            description: error.detail || "Terjadi kesalahan saat menghubungkan akun Google.",
          });
        }
      } catch (error) {
        toast.error("Gagal Terhubung", {
          description: "Terjadi kesalahan saat menghubungkan akun Google.",
        });
      } finally {
        setIsConnectingGoogle(false);
      }
    },
    onError: () => {
      toast.error("Login Google Dibatalkan", {
        description: "Anda membatalkan proses login Google.",
      });
      setIsConnectingGoogle(false);
    },
    flow: "implicit",
  });

  // Loading states
  const isLoading = authLoading || profileLoading;
  const isSaving = updateProfileMutation.isPending || changePasswordMutation.isPending;

  // Show loading skeleton
  if (isLoading) {
    return (
      <div className="mx-auto max-w-7xl pb-12 pt-40">
        <div className="bg-card rounded-lg p-8">
          <div className="flex flex-col items-center md:flex-row md:items-start gap-8">
            <div className="flex flex-col items-center">
              <Skeleton className="h-32 w-32 rounded-full" />
              <div className="mt-4 text-center">
                <Skeleton className="h-6 w-32 rounded mb-2" />
                <Skeleton className="h-4 w-40 rounded" />
              </div>
            </div>
            <div className="flex-1 space-y-6">
              <Card className="bg-gray-800/50 border-gray-700 p-6">
                <Skeleton className="h-7 w-48 rounded mb-4" />
                <div className="space-y-4">
                  <Skeleton className="h-16 w-full rounded" />
                  <Skeleton className="h-16 w-full rounded" />
                  <Skeleton className="h-16 w-full rounded" />
                </div>
              </Card>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!session || !profile) {
    return null;
  }

  const { user } = session;
  if (!user) {
    return null;
  }

  const displayName = profile.full_name || user?.email?.split("@")[0] || "User";
  const displayInitials = (displayName || "U")
    .split(" ")
    .map((n: string) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2) || "U";

  return (
    <div className="mx-auto max-w-7xl pb-12 pt-40">
      <div className="bg-card rounded-2xl p-8">
        <div className="flex flex-col items-center md:flex-row md:items-start gap-8">
          {/* Avatar Section */}
          <div className="flex flex-col items-center">
            <Avatar className="h-32 w-32 border-4 border-purple-500/30">
              <AvatarImage src={profile.photo || undefined} alt={displayName} />
              <AvatarFallback className="bg-linear-to-br from-purple-500 to-pink-500 text-white text-3xl font-bold">
                {displayInitials}
              </AvatarFallback>
            </Avatar>
            <div className="mt-4 text-center">
              <h2 className="text-xl font-bold text-white">{displayName}</h2>
              <p className="text-sm text-gray-200">{user?.email || ""}</p>
            </div>
          </div>

          {/* Profile Info Section */}
          <div className="flex-1 space-y-6">
            {/* Basic Info Card */}
            <Card className="bg-card border-border/50 p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-white">Informasi Profil</h3>
                {!isEditing && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsEditing(true)}
                    className="border-primary/50 text-primary hover:bg-primary/10"
                  >
                    <Edit2 className="h-4 w-4 mr-2" />
                    Edit
                  </Button>
                )}
              </div>

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                {/* Full Name */}
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                    <User className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1">
                    <Label className="text-sm text-white mb-1">Nama Lengkap</Label>
                    {isEditing ? (
                      <div>
                        <Input
                          {...register("full_name")}
                          placeholder="Masukkan nama lengkap"
                          className="bg-foreground/50 border-border text-white placeholder-white"
                          disabled={isSaving}
                        />
                        {errors.full_name && (
                          <p className="text-sm text-red-400 mt-1">{errors.full_name.message}</p>
                        )}
                      </div>
                    ) : (
                      <p className="text-white">{profile.full_name || "-"}</p>
                    )}
                  </div>
                </div>

                {/* Email */}
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                    <Mail className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1">
                    <Label className="text-sm text-white mb-1">Email</Label>
                    <p className="text-white">{user?.email || ""}</p>
                  </div>
                </div>

                {/* Phone */}
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                    <Phone className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1">
                    <Label className="text-sm text-white mb-1">Nomor Telepon</Label>
                    {isEditing ? (
                      <Controller
                        name="contact_phone"
                        control={control}
                        render={({ field }) => (
                          <PhoneInputWithCountry
                            {...field}
                            placeholder="812 3456 7890"
                            disabled={isSaving}
                            className="bg-foreground/50 border-border text-white placeholder-white"
                          />
                        )}
                      />
                    ) : (
                      <p className="text-white">{profile.contact_phone || "-"}</p>
                    )}
                  </div>
                </div>

                {/* Action Buttons */}
                {isEditing && (
                  <div className="flex gap-3 pt-4">
                    <Button
                      type="submit"
                      disabled={isSaving}
                      className="bg-primary hover:bg-primary/90 text-white"
                    >
                      <Save className="h-4 w-4 mr-2" />
                      {isSaving ? "Menyimpan..." : "Simpan"}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleCancelEdit}
                      disabled={isSaving}
                      className="border-border text-white hover:bg-foreground/10"
                    >
                      <X className="h-4 w-4 mr-2" />
                      Batal
                    </Button>
                  </div>
                )}
              </form>
            </Card>

            {/* Change Password Card */}
            <Card className="bg-card border-border/50 p-6">
              <div className="mb-4">
                <h3 className="text-lg font-semibold text-white">Keamanan</h3>
              </div>

              {isChangingPassword ? (
                <form onSubmit={handleSubmitPassword(onPasswordSubmit)} className="space-y-4">
                  {/* Old Password */}
                  <div>
                    <Label className="text-sm text-white mb-1">Kata Sandi Lama</Label>
                    <div className="relative">
                      <Input
                        {...registerPassword("old_password")}
                        type={showOldPassword ? "text" : "password"}
                        placeholder="Masukkan kata sandi lama"
                        className="bg-foreground/50 border-border text-white placeholder-white pr-10"
                        disabled={isSaving}
                      />
                      <button
                        type="button"
                        onClick={() => setShowOldPassword(!showOldPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-300 hover:text-gray-100"
                      >
                        {showOldPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                    {passwordErrors.old_password && (
                      <p className="text-sm text-red-400 mt-1">{passwordErrors.old_password.message}</p>
                    )}
                  </div>

                  {/* New Password */}
                  <div>
                    <Label className="text-sm text-white mb-1">Kata Sandi Baru</Label>
                    <div className="relative">
                      <Input
                        {...registerPassword("new_password")}
                        type={showNewPassword ? "text" : "password"}
                        placeholder="Masukkan kata sandi baru"
                        className="bg-foreground/50 border-border text-white placeholder-white pr-10"
                        disabled={isSaving}
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-300 hover:text-gray-100"
                      >
                        {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                    {passwordErrors.new_password && (
                      <p className="text-sm text-red-400 mt-1">{passwordErrors.new_password.message}</p>
                    )}
                  </div>

                  {/* Confirm Password */}
                  <div>
                    <Label className="text-sm text-white mb-1">Konfirmasi Kata Sandi Baru</Label>
                    <div className="relative">
                      <Input
                        {...registerPassword("confirm_password")}
                        type={showConfirmPassword ? "text" : "password"}
                        placeholder="Konfirmasi kata sandi baru"
                        className="bg-foreground/50 border-border text-white placeholder-white pr-10"
                        disabled={isSaving}
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-300 hover:text-gray-100"
                      >
                        {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                    {passwordErrors.confirm_password && (
                      <p className="text-sm text-red-400 mt-1">{passwordErrors.confirm_password.message}</p>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-3 pt-4">
                    <Button
                      type="submit"
                      disabled={isSaving}
                      className="bg-primary hover:bg-primary/90 text-white"
                    >
                      <Save className="h-4 w-4 mr-2" />
                      {isSaving ? "Menyimpan..." : "Simpan"}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleCancelPasswordChange}
                      disabled={isSaving}
                      className="border-border text-white hover:bg-foreground/10"
                    >
                      <X className="h-4 w-4 mr-2" />
                      Batal
                    </Button>
                  </div>
                </form>
              ) : (
                <div className="space-y-6">
                  {/* Password Change Section */}
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="text-white font-semibold">Kata Sandi</h4>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setIsChangingPassword(true)}
                        className="border-primary/50 text-primary hover:bg-primary/10"
                      >
                        <Lock className="h-4 w-4 mr-2" />
                        Ubah
                      </Button>
                    </div>
                    <p className="text-white text-sm">
                      Ubah kata sandi Anda secara berkala untuk menjaga keamanan akun.
                    </p>
                  </div>

                  {/* Google Connection Section */}
                  <div className="border-t border-border/50 pt-6">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                          <Mail className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <h4 className="text-white font-semibold">Google</h4>
                          {profile?.user_data?.google_id ? (
                            <p className="text-xs text-green-400">Terhubung</p>
                          ) : (
                            <p className="text-xs text-gray-400">Tidak terhubung</p>
                          )}
                        </div>
                      </div>
                      {!profile?.user_data?.google_id && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => googleLogin()}
                          disabled={isConnectingGoogle}
                          className="border-primary/50 text-primary hover:bg-primary/10"
                        >
                          {isConnectingGoogle ? (
                            <Loader className="h-4 w-4 mr-2 animate-spin" />
                          ) : (
                            <Mail className="h-4 w-4 mr-2" />
                          )}
                          {isConnectingGoogle ? "Menghubungkan..." : "Hubungkan"}
                        </Button>
                      )}
                    </div>
                    <p className="text-white text-sm">
                      Hubungkan akun Google Anda untuk memudahkan login dan keamanan akun yang lebih baik.
                    </p>
                  </div>
                </div>
              )}
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
