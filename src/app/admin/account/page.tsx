"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

const AccountSchema = z.object({
  name: z.string().min(1, "Name is required"),
});

type AccountFormValues = z.infer<typeof AccountSchema>;

export default function AdminAccountPage() {
  const router = useRouter();

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<AccountFormValues>({
    resolver: zodResolver(AccountSchema),
    defaultValues: {
      name: "",
    },
  });

  useEffect(() => {
    const loadAccount = async () => {
      try {
        const res = await fetch("/api/admin/account", {
          method: "GET",
          credentials: "include",
        });
        const data = await res.json();

        if (data?.success && data.user) {
          if (data.user.name) {
            setValue("name", data.user.name);
          }
        } else if (res.status === 401) {
          router.replace("/admin/login");
        }
      } catch (error) {
        console.error("Failed to load account", error);
        toast.error("Failed to load account", {
          description: "Please try again.",
        });
      }
    };

    loadAccount();
  }, [router, setValue]);

  const onSubmit = async (values: AccountFormValues) => {
    try {
      const res = await fetch("/api/admin/account", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(values),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        toast.success("Account updated", {
          description: "Your profile has been updated.",
        });
        // Reload to ensure sidebar picks up new name
        setTimeout(() => {
          window.location.reload();
        }, 500);
      } else {
        toast.error("Update failed", {
          description: data.message || "Please check your input.",
        });
      }
    } catch (error) {
      console.error("Update account error", error);
      toast.error("Update failed", {
        description: "An error occurred. Please try again.",
      });
    }
  };

  return (
    <div className="flex flex-1 flex-col px-4 py-6 lg:px-6 lg:py-8">
      <div className="mx-auto w-full max-w-xl rounded-xl border border-border bg-card/80 p-6 shadow-lg backdrop-blur-md">
        <h2 className="text-xl font-semibold">Account Settings</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Update your admin profile information.
        </p>

        <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Display Name</Label>
            <Input
              id="name"
              {...register("name")}
              placeholder="Enter your display name"
              className={errors.name ? "border-red-500" : ""}
            />
            {errors.name && (
              <p className="text-xs text-red-400">{errors.name.message}</p>
            )}
          </div>

          <div className="pt-2 flex justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => router.back()}
            >
              Cancel
            </Button>
            <Button type="submit" size="sm" disabled={isSubmitting}>
              {isSubmitting ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}


