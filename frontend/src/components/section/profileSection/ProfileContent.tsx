/* eslint-disable @typescript-eslint/no-misused-promises */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth";
import { API_URL } from "@/lib/api-url";
import { useProfile, useUpdateProfile, useChangePassword } from "@/lib/profile";
import { useSendEmailVerification } from "@/lib/users";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PhoneInputWithCountry } from "@/components/ui/phone-input-with-country";
import {
  User,
  Mail,
  Phone,
  Edit2,
  Save,
  X,
  Lock,
  Eye,
  EyeOff,
  Loader,
  AlertCircle,
  CheckCircle2,
  Send,
} from "lucide-react";
import { useForm, Controller } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";
import { useGoogleLogin } from "@react-oauth/google";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

// ==================== VALIDATION SCHEMAS ====================

const ProfileSchema = z.object({
  full_name: z
    .string()
    .min(1, "Nama wajib diisi")
    .max(100, "Nama terlalu panjang"),
  contact_phone: z.string().optional(),
});

const ChangePasswordSchema = z
  .object({
    old_password: z.string().min(1, "Kata sandi lama wajib diisi"),
    new_password: z.string().min(8, "Kata sandi baru minimal 8 karakter"),
    confirm_password: z.string().min(1, "Konfirmasi kata sandi wajib diisi"),
  })
  .refine((data) => data.new_password === data.confirm_password, {
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
  const {
    data: profile,
    isLoading: profileLoading,
    error: profileError,
    refetch,
  } = useProfile({
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
        description:
          error.message || "Terjadi kesalahan saat memperbarui profil.",
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
        description:
          error.message || "Terjadi kesalahan saat mengubah kata sandi.",
      });
    },
  });

  // Send email verification mutation
  const sendVerificationMutation = useSendEmailVerification({
    onSuccess: () => {
      toast.success("Email Verifikasi Terkirim", {
        description: "Silakan cek inbox atau folder spam email Anda.",
      });
    },
    onError: (error: any) => {
      toast.error("Gagal Mengirim Email", {
        description:
          error.message || "Terjadi kesalahan saat mengirim email verifikasi.",
      });
    },
  });

  // Profile form
  const {
    register,
    handleSubmit,
    formState: {
      errors,
      isValid: profileIsValid,
      isSubmitted: profileIsSubmitted,
    },
    setValue,
    watch,
    control,
  } = useForm<ProfileFormData>({
    resolver: zodResolver(ProfileSchema),
    mode: "onChange",
  });

  // Password form
  const {
    register: registerPassword,
    handleSubmit: handleSubmitPassword,
    formState: {
      errors: passwordErrors,
      isValid: passwordIsValid,
      isSubmitted: passwordIsSubmitted,
    },
    reset: resetPassword,
  } = useForm<ChangePasswordFormData>({
    resolver: zodResolver(ChangePasswordSchema),
    mode: "onChange",
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
      setValue("full_name", profile.full_name || "", { shouldValidate: true });
      setValue("contact_phone", profile.contact_phone || "", {
        shouldValidate: true,
      });
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
        const res = await fetch(`${API_URL}/api/v1/auth/connect-google/`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("access_token")}`,
          },
          body: JSON.stringify({
            access_token: response.access_token,
          }),
        });

        if (res.ok) {
          toast.success("Google Terhubung", {
            description:
              "Akun Google Anda berhasil terhubung ke akun Roxas Anda.",
          });
          // Refetch profile to get updated data
          refetch?.();
        } else {
          const error = await res.json();
          toast.error("Gagal Terhubung", {
            description:
              error.detail ||
              "Terjadi kesalahan saat menghubungkan akun Google.",
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
  const isSaving =
    updateProfileMutation.isPending || changePasswordMutation.isPending;

  // Show loading skeleton
  if (isLoading) {
    return (
      <div className="mx-auto max-w-7xl pt-40 pb-12">
        <div className="bg-card rounded-lg p-8">
          <div className="flex flex-col items-center gap-8 md:flex-row md:items-start">
            <div className="flex flex-col items-center">
              <Skeleton className="h-32 w-32 rounded-full" />
              <div className="mt-4 text-center">
                <Skeleton className="mb-2 h-6 w-32 rounded" />
                <Skeleton className="h-4 w-40 rounded" />
              </div>
            </div>
            <div className="flex-1 space-y-6">
              <Card className="border-gray-700 bg-gray-800/50 p-6">
                <Skeleton className="mb-4 h-7 w-48 rounded" />
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
  const displayInitials =
    (displayName || "U")
      .split(" ")
      .map((n: string) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2) || "U";

  return (
    <div className="mx-auto lg:max-w-7xl w-11/12 lg:pt-40 pt-26 pb-12">
      <div className="rounded-2xl">
        <div className="flex flex-col items-center gap-8 md:flex-row md:items-start">
          {/* Avatar Section */}
          <div className="flex flex-col items-center">
            <Avatar className="h-32 w-32 border-2">
              <AvatarImage src={profile.photo || undefined} alt={displayName} />
              <AvatarFallback className="bg-primary text-6xl lg:font-bold font-medium text-white">
                {displayInitials}
              </AvatarFallback>
            </Avatar>
            <div className="mt-4 text-center">
              <h2 className="text-2xl capitalize font-semibold text-white">{displayName}</h2>
              <p className="text-sm text-gray-200">{user?.email || ""}</p>
            </div>
          </div>

          {/* Profile Info Section */}
          <div className="flex-1 space-y-4">
            {/* Email Verification Alert */}
            {profile.user_data && !profile.user_data.email_verified && (
              <Alert className="border-yellow-500/50 bg-yellow-500/10">
                <AlertCircle className="h-5 w-5 text-yellow-500" />
                <AlertTitle className="font-semibold text-yellow-500">
                  Email Belum Diverifikasi
                </AlertTitle>
                <AlertDescription className="mt-2 text-yellow-200">
                  <p className="mb-3">
                    Akun Anda belum diverifikasi. Silakan verifikasi email untuk
                    keamanan akun Anda.
                  </p>
                  <Button
                    size="sm"
                    onClick={() =>
                      sendVerificationMutation.mutate(profile.user_data.id)
                    }
                    disabled={sendVerificationMutation.isPending}
                    className="bg-yellow-500 text-black hover:bg-yellow-600"
                  >
                    {sendVerificationMutation.isPending ? (
                      <>
                        <Loader className="mr-2 h-4 w-4 animate-spin" />
                        Mengirim...
                      </>
                    ) : (
                      <>
                        <Send className="mr-2 h-4 w-4" />
                        Kirim Email Verifikasi
                      </>
                    )}
                  </Button>
                </AlertDescription>
              </Alert>
            )}

            {/* Email Verified Success */}
            {profile.user_data && profile.user_data.email_verified && (
              <Alert className="border-green-500/50 bg-green-500/10">
                <CheckCircle2 className="h-5 w-5 text-green-500" />
                <AlertTitle className="font-semibold text-green-500">
                  Email Terverifikasi
                </AlertTitle>
                <AlertDescription className="text-green-200">
                  Email Anda telah berhasil diverifikasi pada{" "}
                  {profile.user_data.email_verified_at
                    ? new Date(
                        profile.user_data.email_verified_at,
                      ).toLocaleDateString("id-ID", {
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                      })
                    : "sebelumnya"}
                  .
                </AlertDescription>
              </Alert>
            )}

            {/* Basic Info Card */}
            <Card className="bg-card border-none lg:p-6 p-5">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-white">
                  Informasi Profil
                </h3>
                {!isEditing && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsEditing(true)}
                    className="border-primary/50 text-primary hover:bg-primary/10"
                  >
                    <Edit2 className="mr-2 h-4 w-4" />
                    Edit
                  </Button>
                )}
              </div>

              <form onSubmit={handleSubmit(onSubmit)} className="lg:space-y-4 space-y-6">
                {/* Full Name */}
                <div className="flex items-center gap-3">
                  <div className="bg-primary/10 flex h-10 w-10 items-center justify-center rounded-lg">
                    <User className="text-primary h-5 w-5" />
                  </div>
                  <div className="flex-1">
                    <Label className="text-sm text-white">
                      Nama Lengkap
                    </Label>
                    {isEditing ? (
                      <div>
                        <Input
                          {...register("full_name")}
                          placeholder="Masukkan nama lengkap"
                          className="bg-foreground/50 border-border text-white placeholder-white"
                          disabled={isSaving}
                        />
                        {errors.full_name && (
                          <p className="mt-1 text-sm text-red-400">
                            {errors.full_name.message}
                          </p>
                        )}
                      </div>
                    ) : (
                      <p className="text-gray-400">{profile.full_name || "-"}</p>
                    )}
                  </div>
                </div>

                {/* Email */}
                <div className="flex items-center gap-3">
                  <div className="bg-primary/10 flex h-10 w-10 items-center justify-center rounded-lg">
                    <Mail className="text-primary h-5 w-5" />
                  </div>
                  <div className="flex-1">
                    <Label className="text-sm text-white">Email</Label>
                    <p className="text-gray-400">{user?.email || ""}</p>
                  </div>
                </div>

                {/* Phone */}
                <div className="flex items-center gap-3">
                  <div className="bg-primary/10 flex h-10 w-10 items-center justify-center rounded-lg">
                    <Phone className="text-primary h-5 w-5" />
                  </div>
                  <div className="flex-1">
                    <Label className="text-sm text-white">
                      Nomor Telepon
                    </Label>
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
                      <p className="text-gray-400">
                        {profile.contact_phone || "-"}
                      </p>
                    )}
                  </div>
                </div>

                {/* Action Buttons */}
                {isEditing && (
                  <div className="flex gap-3 pt-4">
                    <Button
                      type="submit"
                      disabled={
                        isSaving || (profileIsSubmitted && !profileIsValid)
                      }
                      className="bg-primary hover:bg-primary/90 text-white"
                    >
                      <Save className="mr-2 h-4 w-4" />
                      {isSaving ? "Menyimpan..." : "Simpan"}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleCancelEdit}
                      disabled={isSaving}
                      className="border-border hover:bg-foreground/10 text-white"
                    >
                      <X className="mr-2 h-4 w-4" />
                      Batal
                    </Button>
                  </div>
                )}
              </form>
            </Card>

            {/* Change Password Card */}
            <Card className="bg-card border-none lg:p-6 p-5">
              <div>
                <h3 className="text-lg font-semibold text-white">Keamanan</h3>
              </div>

              {isChangingPassword ? (
                <form
                  onSubmit={handleSubmitPassword(onPasswordSubmit)}
                  className="space-y-4"
                >
                  {/* Old Password */}
                  <div>
                    <Label className="mb-1 text-sm text-white">
                      Kata Sandi Lama
                    </Label>
                    <div className="relative">
                      <Input
                        {...registerPassword("old_password")}
                        type={showOldPassword ? "text" : "password"}
                        placeholder="Masukkan kata sandi lama"
                        className="bg-foreground/50 border-border pr-10 text-white placeholder-white"
                        disabled={isSaving}
                      />
                      <button
                        type="button"
                        onClick={() => setShowOldPassword(!showOldPassword)}
                        className="absolute top-1/2 right-3 -translate-y-1/2 text-gray-300 hover:text-gray-100"
                      >
                        {showOldPassword ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                    {passwordErrors.old_password && (
                      <p className="mt-1 text-sm text-red-400">
                        {passwordErrors.old_password.message}
                      </p>
                    )}
                  </div>

                  {/* New Password */}
                  <div>
                    <Label className="mb-1 text-sm text-white">
                      Kata Sandi Baru
                    </Label>
                    <div className="relative">
                      <Input
                        {...registerPassword("new_password")}
                        type={showNewPassword ? "text" : "password"}
                        placeholder="Masukkan kata sandi baru"
                        className="bg-foreground/50 border-border pr-10 text-white placeholder-white"
                        disabled={isSaving}
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        className="absolute top-1/2 right-3 -translate-y-1/2 text-gray-300 hover:text-gray-100"
                      >
                        {showNewPassword ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                    {passwordErrors.new_password && (
                      <p className="mt-1 text-sm text-red-400">
                        {passwordErrors.new_password.message}
                      </p>
                    )}
                  </div>

                  {/* Confirm Password */}
                  <div>
                    <Label className="mb-1 text-sm text-white">
                      Konfirmasi Kata Sandi Baru
                    </Label>
                    <div className="relative">
                      <Input
                        {...registerPassword("confirm_password")}
                        type={showConfirmPassword ? "text" : "password"}
                        placeholder="Konfirmasi kata sandi baru"
                        className="bg-foreground/50 border-border pr-10 text-white placeholder-white"
                        disabled={isSaving}
                      />
                      <button
                        type="button"
                        onClick={() =>
                          setShowConfirmPassword(!showConfirmPassword)
                        }
                        className="absolute top-1/2 right-3 -translate-y-1/2 text-gray-300 hover:text-gray-100"
                      >
                        {showConfirmPassword ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                    {passwordErrors.confirm_password && (
                      <p className="mt-1 text-sm text-red-400">
                        {passwordErrors.confirm_password.message}
                      </p>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-3 pt-4">
                    <Button
                      type="submit"
                      disabled={
                        isSaving || (passwordIsSubmitted && !passwordIsValid)
                      }
                      className="bg-primary hover:bg-primary/90 text-white"
                    >
                      <Save className="mr-2 h-4 w-4" />
                      {isSaving ? "Menyimpan..." : "Simpan"}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleCancelPasswordChange}
                      disabled={isSaving}
                      className="border-border hover:bg-foreground/10 text-white"
                    >
                      <X className="mr-2 h-4 w-4" />
                      Batal
                    </Button>
                  </div>
                </form>
              ) : (
                <div className="space-y-6">
                  {/* Password Change Section */}
                  <div>
                    <div className="mb-3 flex items-center justify-between">
                      <h4 className="font-semibold text-white">Kata Sandi</h4>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setIsChangingPassword(true)}
                        className="border-primary/50 text-primary hover:bg-primary/10"
                      >
                        <Lock className="mr-2 h-4 w-4" />
                        Ubah
                      </Button>
                    </div>
                    <p className="text-sm text-white">
                      Ubah kata sandi Anda secara berkala untuk menjaga keamanan
                      akun.
                    </p>
                  </div>

                  {/* Google Connection Section */}
                  <div className="border-border/50 border-t pt-6">
                    <div className="mb-3 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="bg-primary/10 flex h-10 w-10 items-center justify-center rounded-lg">
                          <Mail className="text-primary h-5 w-5" />
                        </div>
                        <div>
                          <h4 className="font-semibold text-white">Google</h4>
                          {profile?.user_data?.google_id ? (
                            <p className="text-xs text-green-400">Terhubung</p>
                          ) : (
                            <p className="text-xs text-gray-400">
                              Tidak terhubung
                            </p>
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
                            <Loader className="mr-2 h-4 w-4 animate-spin" />
                          ) : (
                            <Mail className="mr-2 h-4 w-4" />
                          )}
                          {isConnectingGoogle
                            ? "Menghubungkan..."
                            : "Hubungkan"}
                        </Button>
                      )}
                    </div>
                    <p className="text-sm text-white">
                      Hubungkan akun Google Anda untuk memudahkan login dan
                      keamanan akun yang lebih baik.
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
