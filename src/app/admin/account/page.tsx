"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Save, User, Mail } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { AppSidebar } from "@/components/app-sidebar";
import { AdminHeader } from "@/components/admin-header";
import {
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar";
import { toast } from "sonner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

interface AccountData {
  id: string;
  email: string;
  name: string | null;
  image: string | null;
}

export default function AdminAccountPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [accountData, setAccountData] = useState<AccountData | null>(null);
  const [formData, setFormData] = useState({
    name: "",
  });

  // Load account data
  useEffect(() => {
    const loadAccount = async () => {
      try {
        setLoading(true);
        const res = await fetch("/api/admin/account", {
          method: "GET",
          credentials: "include",
        });
        const data = await res.json();

        if (res.ok && data?.success && data.user) {
          setAccountData(data.user);
          setFormData({
            name: data.user.name || "",
          });
        } else if (res.status === 401) {
          router.replace("/admin/login");
        } else {
          toast.error("Failed to load account", {
            description: data.message || "Please try again.",
          });
        }
      } catch (error) {
        console.error("Failed to load account", error);
        toast.error("Failed to load account", {
          description: "Please try again.",
        });
      } finally {
        setLoading(false);
      }
    };

    loadAccount();
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      toast.error("Name is required");
      return;
    }

    setSaving(true);

    try {
      const res = await fetch("/api/admin/account", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        toast.success("Account updated successfully", {
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
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <SidebarProvider
        style={
          {
            "--sidebar-width": "calc(var(--spacing) * 72)",
            "--header-height": "calc(var(--spacing) * 12)",
          } as React.CSSProperties
        }
      >
        <AppSidebar variant="inset" />
        <SidebarInset>
          <AdminHeader />
          <div className="flex flex-1 flex-col">
            <div className="@container/main flex flex-1 flex-col gap-2">
              <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
                <div className="container mx-auto px-4 lg:px-6">
                  <div className="flex items-center justify-center min-h-[400px]">
                    <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </SidebarInset>
      </SidebarProvider>
    );
  }

  return (
    <SidebarProvider
      style={
        {
          "--sidebar-width": "calc(var(--spacing) * 72)",
          "--header-height": "calc(var(--spacing) * 12)",
        } as React.CSSProperties
      }
    >
      <AppSidebar variant="inset" />
      <SidebarInset>
        <AdminHeader />
        <div className="flex flex-1 flex-col">
          <div className="@container/main flex flex-1 flex-col gap-2">
            <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
              <div className="container mx-auto px-4 lg:px-6">
                {/* Header */}
                <div className="mb-6">
                  <div>
                    <h1 className="text-3xl font-bold">Account Settings</h1>
                    <p className="mt-2 text-gray-400">
                      Manage your admin account information
                    </p>
                  </div>
                </div>

                {/* Main Content */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Left Column - Edit Form */}
                  <div className="lg:col-span-2">
                    <Card className="bg-gray-900 border-gray-800">
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <User className="h-5 w-5" />
                          Account Information
                        </CardTitle>
                        <CardDescription>
                          Update your account details
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <form onSubmit={handleSubmit} className="space-y-6">
                          {/* Email (Read-only) */}
                          <div className="space-y-2">
                            <Label htmlFor="email" className="flex items-center gap-2">
                              <Mail className="h-4 w-4" />
                              Email Address
                            </Label>
                            <Input
                              id="email"
                              type="email"
                              value={accountData?.email || ""}
                              disabled
                              className="bg-gray-800 text-gray-400 border-gray-700 cursor-not-allowed"
                            />
                            <p className="text-xs text-gray-500">
                              Email cannot be changed
                            </p>
                          </div>

                          <Separator className="bg-gray-700" />

                          {/* Name */}
                          <div className="space-y-2">
                            <Label htmlFor="name" className="flex items-center gap-2">
                              <User className="h-4 w-4" />
                              Display Name <span className="text-red-400">*</span>
                            </Label>
                            <Input
                              id="name"
                              type="text"
                              value={formData.name}
                              onChange={(e) =>
                                setFormData({ ...formData, name: e.target.value })
                              }
                              placeholder="Enter your display name"
                              required
                              className="bg-gray-800 text-gray-100 border-gray-700"
                            />
                            <p className="text-xs text-gray-500">
                              This name will be displayed in the admin panel
                            </p>
                          </div>

                          {/* Form Actions */}
                          <div className="flex justify-end gap-3 pt-4">
                            <Button
                              type="button"
                              variant="outline"
                              onClick={() => router.back()}
                              className="bg-gray-800 text-gray-100 border-gray-700 hover:bg-gray-700"
                            >
                              Cancel
                            </Button>
                            <Button
                              type="submit"
                              disabled={saving}
                              className="bg-primary hover:bg-primary/90"
                            >
                              {saving ? (
                                <>
                                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                  Saving...
                                </>
                              ) : (
                                <>
                                  <Save className="mr-2 h-4 w-4" />
                                  Save Changes
                                </>
                              )}
                            </Button>
                          </div>
                        </form>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Right Column - Info Card */}
                  <div className="lg:col-span-1">
                    <Card className="bg-gray-900 border-gray-800">
                      <CardHeader>
                        <CardTitle className="text-lg">Account Details</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div>
                          <p className="text-xs text-gray-500 mb-1">User ID</p>
                          <p className="text-sm font-mono text-gray-300">
                            {accountData?.id || "-"}
                          </p>
                        </div>
                        <Separator className="bg-gray-700" />
                        <div>
                          <p className="text-xs text-gray-500 mb-1">Email</p>
                          <p className="text-sm text-gray-300">
                            {accountData?.email || "-"}
                          </p>
                        </div>
                        <Separator className="bg-gray-700" />
                        <div>
                          <p className="text-xs text-gray-500 mb-1">Display Name</p>
                          <p className="text-sm text-gray-300">
                            {accountData?.name || "Not set"}
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        </SidebarInset>
      </SidebarProvider>
    );
  }
