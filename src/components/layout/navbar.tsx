/* eslint-disable @typescript-eslint/prefer-nullish-coalescing */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-floating-promises */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useSession, signOut } from "@/lib/auth-client";
import { toast } from "sonner";

import {
  Gamepad2,
  Search,
  Menu,
  X,
  Calculator,
  ReceiptText,
  ChartNoAxesColumn,
  LogIn,
  UserRoundPlus,
  SquareChartGantt,
  LogOut,
  User,
  UserCircle,
  Settings,
} from "lucide-react";

import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

import logo from "public/img/logo1.webp";
import Indonesia from "public/img/indonesia-logo.webp";
import uk from "public/img/uk-logo.webp";
import { flattenProducts } from "@/lib/data/flattenProducts";

type NavItem = {
  key: string; // key i18n
  href: string;
  icon?: React.ElementType;
};

const navItems: NavItem[] = [
  { key: "home", href: "/", icon: Gamepad2 },
  { key: "transaction", href: "/transaction", icon: ReceiptText },
  { key: "leaderboard", href: "/leaderboard", icon: ChartNoAxesColumn },
  { key: "calculator", href: "", icon: Calculator },
];

const Navigationbar = () => {
  const [open, setOpen] = useState(false);
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const { data: session, isPending } = useSession();

  const t = useTranslations("Navigation");
  const router = useRouter();
  const pathname = usePathname();

  const locale = pathname.split("/")[1] ?? "id";
  const cleanPath = pathname.replace(`/${locale}`, "") || "/";

  // Check if user is admin
  useEffect(() => {
    const checkUserRole = async () => {
      if (session?.user) {
        try {
          const response = await fetch("/api/auth/check-role");
          const data = await response.json();
          setIsAdmin(data.success && data.role === "ADMIN");
        } catch (error) {
          console.error("Error checking user role:", error);
          setIsAdmin(false);
        }
      } else {
        setIsAdmin(false);
      }
    };

    checkUserRole();
  }, [session]);

  const handleLogout = async () => {
    const loadingToast = toast.loading("Memproses logout...", {
      description: "Mohon tunggu sebentar...",
    });
    try {
      await signOut();
      toast.dismiss(loadingToast);
      toast.success("Logout Berhasil", {
        description: "Anda telah berhasil logout. Sampai jumpa!",
      });
      router.push(`/${locale}`);
    } catch (error) {
      toast.dismiss(loadingToast);
      toast.error("Logout Gagal", {
        description: "Terjadi kesalahan saat logout. Silakan coba lagi.",
      });
    }
  };

  const toggleMenu = () => setOpen((s) => !s);

  const allProducts = flattenProducts();

  const [query, setQuery] = useState("");
  const [showResult, setShowResult] = useState(false);

  const results = allProducts.filter((item) =>
    item.title.toLowerCase().includes(query.toLowerCase()),
  );

  return (
    <nav className="bg-foreground fixed top-0 left-0 z-50 w-full text-white">
      <div className="mx-auto max-w-7xl px-4 py-4">
        {/* TOP SECTION */}
        <div className="flex items-center justify-between gap-4">
          {/* Logo */}
          <Link href={`/${locale}`} className="text-xl font-bold">
            <Image alt="logo" src={logo} className="w-48" />
          </Link>

          {/* Search */}
          <div className="relative hidden flex-1 md:block">
            <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-white" />

            <Input
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setShowResult(true);
              }}
              onFocus={() => setShowResult(true)}
              placeholder="Cari game atau produk"
              className="w-full rounded-full pl-10 text-white placeholder:text-gray-300 border-gray-600"
            />

            {/* RESULT */}
            {showResult && query && (
              <div className="absolute top-full z-50 mt-2 w-full rounded-xl bg-[#141414] p-2 shadow-2xl">
                {results.length > 0 ? (
                  results.slice(0, 6).map((item, i) => (
                    <Link
                      key={i}
                      href={`/${locale}/product/${item.slug}`}
                      onClick={() => {
                        setQuery("");
                        setShowResult(false);
                      }}
                      className="flex items-center gap-3 rounded-lg p-3 hover:bg-primary/30"
                    >
                      <Image
                        src={item.image}
                        alt={item.title}
                        width={40}
                        height={40}
                        className="rounded-md"
                      />

                      <div>
                        <p className="text-sm font-semibold text-white">
                          {item.title}
                        </p>
                        <p className="text-xs text-gray-400">
                          {item.subtitle} • {item.category}
                        </p>
                      </div>
                    </Link>
                  ))
                ) : (
                  <p className="p-3 text-sm text-gray-400">
                    Produk tidak ditemukan
                  </p>
                )}
              </div>
            )}
          </div>

          <div className="hidden md:flex">
            <Dialog>
              <DialogTrigger asChild>
                <Button className="flex cursor-pointer items-center rounded-full px-2 hover:bg-rose-500/90">
                  <Image
                    alt=""
                    src={locale === "en" ? uk : Indonesia}
                    width={24}
                  />
                  <p className="ml-1">{t("language")}</p>
                </Button>
              </DialogTrigger>

              <DialogContent className="max-w-xs border-0">
                <DialogHeader>
                  <DialogTitle className="text-white">
                    {t("chooseLanguage")}
                  </DialogTitle>
                </DialogHeader>

                <div className="flex w-full gap-3">
                  {/* Indonesia */}
                  <Button
                    variant="outline"
                    onClick={() => router.push(`/id${cleanPath}`)}
                    className={`flex flex-1 cursor-pointer items-center gap-2 p-2 ${locale === "id" ? "border-rose-500 text-rose-500" : "border-gray-600 text-white"} hover:bg-gray-800`}
                  >
                    <Image alt="" src={Indonesia} width={24} />
                    <p className="ml-1 text-white">Bahasa Indonesia</p>
                  </Button>

                  {/* English */}
                  <Button
                    variant="outline"
                    onClick={() => router.push(`/en${cleanPath}`)}
                    className={`flex flex-1 cursor-pointer items-center gap-2 p-2 ${locale === "en" ? "border-rose-500 text-rose-500" : "border-gray-600 text-white"} hover:bg-gray-800`}
                  >
                    <Image alt="" src={uk} width={24} />
                    <p className="ml-1 text-white">English</p>
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {/* Mobile Menu Button */}
          <button onClick={toggleMenu} className="md:hidden">
            {open ? <X size={26} /> : <Menu size={26} />}
          </button>
        </div>

          {/* DESKTOP NAV */}
        <div className="mt-6 flex items-center justify-between">
          <div className="hidden items-center gap-6 md:flex">
            {navItems.map((item) => {
              const Icon = item.icon;

              // Hide transaction link for admin users
              if (item.key === "transaction" && isAdmin) {
                return null;
              }

              if (item.key === "calculator") {
                const isCalculatorActive =
                  cleanPath === "/calculator" ||
                  cleanPath.startsWith("/calculator/");

                return (
                  <div key="calculator" className="group relative">
                    {/* TRIGGER (BUKAN LINK) */}
                    <button
                      type="button"
                      className={`relative flex cursor-pointer items-center gap-2 text-sm transition ${
                        isCalculatorActive
                          ? "font-semibold text-rose-500 after:absolute after:-bottom-4 after:left-0 after:h-0.5 after:w-full after:bg-rose-500"
                          : "text-gray-300 hover:text-white"
                      }`}
                    >
                      <Calculator className="h-5 w-5" />
                      {t("calculator")}
                    </button>

                    {/* DROPDOWN */}
                    <div className="invisible absolute top-full left-0 z-50 mt-4 w-96 rounded-xl bg-[#141414] p-4 opacity-0 shadow-2xl transition-all duration-200 group-hover:visible group-hover:opacity-100">
                      {/* ARROW */}
                      <div className="absolute -top-2 left-6 h-4 w-4 rotate-45 bg-[#141414]" />

                      <div className="space-y-3">
                        <CalculatorDropdownItem
                          title="Win Rate"
                          desc="Digunakan untuk menghitung total jumlah match yang harus ditempuh untuk mencapai target win rate."
                          href={`/${locale}/calculator/winrate`}
                        />

                        <CalculatorDropdownItem
                          title="Magic Wheel"
                          desc="Digunakan untuk mengetahui total maksimal diamond yang dibutuhkan untuk mendapatkan skin Legends."
                          href={`/${locale}/calculator/magicwheel`}
                        />

                        <CalculatorDropdownItem
                          title="Zodiac"
                          desc="Digunakan untuk mengetahui total diamond maksimal yang dibutuhkan untuk mendapatkan skin Zodiac."
                          href={`/${locale}/calculator/zodiac`}
                        />
                      </div>
                    </div>
                  </div>
                );
              }

              const active = cleanPath === item.href;

              return (
                <Link
                  key={item.href}
                  href={`/${locale}${item.href}`}
                  className={`relative flex items-center gap-2 text-sm transition ${
                    active
                      ? "font-semibold text-rose-500 after:absolute after:-bottom-4 after:left-0 after:h-0.5 after:w-full after:bg-rose-500"
                      : "text-gray-300 hover:text-white"
                  }`}
                >
                  {Icon && <Icon className="h-5 w-5" />}
                  {t(item.key)}
                </Link>
              );
            })}
          </div>

          {/* AUTH BUTTONS */}
          <div className="flex items-center gap-6">
            {isPending || isAdmin === null ? (
              <div className="text-sm text-gray-300">Loading...</div>
            ) : session?.user && !isAdmin ? (
              <div className="group relative">
                {/* TRIGGER BUTTON */}
                <button
                  type="button"
                  className="relative flex cursor-pointer items-center gap-2 text-sm text-gray-300 hover:text-white transition"
                >
                  <Avatar className="h-8 w-8">
                    <AvatarImage
                      src={session.user.image || undefined}
                      alt={session.user.name || "User"}
                    />
                    <AvatarFallback className="bg-gray-700 text-white">
                      {session.user.name
                        ? session.user.name
                            .split(" ")
                            .map((n) => n[0])
                            .join("")
                            .toUpperCase()
                            .slice(0, 2)
                        : session.user.email?.[0]?.toUpperCase() || "U"}
                    </AvatarFallback>
                  </Avatar>
                  <p className="font-medium text-white">
                    {session.user.name || session.user.email}
                  </p>
                </button>

                {/* DROPDOWN */}
                <div className="invisible absolute top-full right-0 z-50 mt-4 w-64 rounded-xl bg-[#141414] p-4 opacity-0 shadow-2xl transition-all duration-200 group-hover:visible group-hover:opacity-100 max-h-[600px] overflow-y-auto">
                  {/* ARROW */}
                  <div className="absolute -top-2 right-6 h-4 w-4 rotate-45 bg-[#141414]" />

                  <div className="space-y-3">
                    {/* USER INFO */}
                    <div className="flex flex-col space-y-1 pb-2 border-b border-gray-800">
                      <p className="text-sm font-semibold text-white">
                        {session.user.name || "User"}
                      </p>
                      <p className="text-xs leading-relaxed text-gray-400">
                        {session.user.email}
                      </p>
                    </div>

                    {/* PROFILE LINK */}
                    <Link
                      href={`/${locale}/profile`}
                      className="group/item flex items-center gap-3 rounded-lg p-3 transition hover:bg-rose-500/10"
                    >
                      <div className="text-primary flex h-8 w-8 items-center justify-center">
                        <UserCircle className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-white">Profile</p>
                      </div>
                    </Link>

                    {/* TRANSACTION LINK */}
                    <Link
                      href={`/${locale}/my-transactions`}
                      className="group/item flex items-center gap-3 rounded-lg p-3 transition hover:bg-rose-500/10"
                    >
                      <div className="text-primary flex h-8 w-8 items-center justify-center">
                        <ReceiptText className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-white">Transaction</p>
                        <p className="text-xs text-gray-400">Order history</p>
                      </div>
                    </Link>

                    {/* SEPARATOR */}
                    <div className="border-t border-gray-800 pt-2"></div>

                    {/* LOGOUT BUTTON */}
                    <button
                      onClick={handleLogout}
                      className="group/item flex items-center gap-3 rounded-lg p-3 transition hover:bg-red-500/10 w-full text-left cursor-pointer"
                    >
                      <div className="text-red-400 flex h-8 w-8 items-center justify-center">
                        <LogOut className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-red-400">Logout</p>
                      </div>
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <>
                <Link
                  href={`/${locale}/login`}
                  className="flex items-center gap-2 text-sm text-gray-300 hover:text-white"
                >
                  <LogIn className="h-5 w-5" />
                  <p>{t("login")}</p>
                </Link>

                <Link
                  href={`/${locale}/register`}
                  className="flex items-center gap-2 text-sm text-gray-300 hover:text-white"
                >
                  <UserRoundPlus className="h-5 w-5" />
                  <p>{t("register")}</p>
                </Link>
              </>
            )}
          </div>
        </div>
      </div>

      {/* MOBILE DROPDOWN */}
      {open && (
        <div className="border-t bg-white text-black shadow-sm md:hidden">
          <div className="flex flex-col gap-3 px-4 py-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-black" />
              <Input
                type="text"
                placeholder={t("searchPlaceholder")}
                className="w-full rounded-full bg-gray-200 pl-10 text-black placeholder:text-gray-600"
              />
            </div>

            {/* Nav Items */}
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = cleanPath === item.href;

              // Hide transaction link for admin users
              if (item.key === "transaction" && isAdmin) {
                return null;
              }

              return (
                <Link
                  key={item.href}
                  href={`/${locale}${item.href}`}
                  onClick={() => setOpen(false)}
                  className={`flex items-center gap-3 rounded-md py-2 text-sm ${
                    active ? "font-semibold text-blue-600" : "text-gray-700"
                  }`}
                >
                  {Icon && <Icon className="h-5 w-5" />}
                  {t(item.key)}
                </Link>
              );
            })}

            {/* Auth Buttons - Mobile */}
            <div className="mt-4 flex flex-col gap-3 border-t pt-4">
              {isPending || isAdmin === null ? (
                <div className="text-sm text-gray-700">Loading...</div>
              ) : session?.user && !isAdmin ? (
                <>
                  <div className="flex items-center gap-2 text-sm text-gray-700">
                    <Avatar className="h-8 w-8">
                      <AvatarImage
                        src={session.user.image || undefined}
                        alt={session.user.name || "User"}
                      />
                      <AvatarFallback className="bg-gray-700 text-white">
                        {session.user.name
                          ? session.user.name
                              .split(" ")
                              .map((n) => n[0])
                              .join("")
                              .toUpperCase()
                              .slice(0, 2)
                          : session.user.email?.[0]?.toUpperCase() || "U"}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">
                        {session.user.name || session.user.email}
                      </p>
                      <p className="text-xs text-gray-500">
                        {session.user.email}
                      </p>
                    </div>
                  </div>
                  <Link
                    href={`/${locale}/profile`}
                    onClick={() => setOpen(false)}
                    className="flex items-center gap-2 rounded-md py-2 text-sm text-gray-700"
                  >
                    <UserCircle className="h-5 w-5" />
                    <p>Profile</p>
                  </Link>
                  <Link
                    href={`/${locale}/my-transactions`}
                    onClick={() => setOpen(false)}
                    className="flex items-center gap-2 rounded-md py-2 text-sm text-gray-700"
                  >
                    <ReceiptText className="h-5 w-5" />
                    <p>Transaction</p>
                  </Link>

                  {/* SEPARATOR */}
                  <div className="border-t border-gray-300 pt-2 mt-2"></div>

                  <Button
                    onClick={() => {
                      handleLogout();
                      setOpen(false);
                    }}
                    variant="outline"
                    className="flex items-center justify-center gap-2 text-red-600 border-red-600 hover:bg-red-50 cursor-pointer"
                  >
                    <LogOut className="h-5 w-5" />
                    <p>Logout</p>
                  </Button>
                </>
              ) : (
                <>
                  <Link
                    href={`/${locale}/login`}
                    onClick={() => setOpen(false)}
                    className="flex items-center gap-2 rounded-md py-2 text-sm text-gray-700"
                  >
                    <LogIn className="h-5 w-5" />
                    <p>{t("login")}</p>
                  </Link>
                  <Link
                    href={`/${locale}/register`}
                    onClick={() => setOpen(false)}
                    className="flex items-center gap-2 rounded-md py-2 text-sm text-gray-700"
                  >
                    <UserRoundPlus className="h-5 w-5" />
                    <p>{t("register")}</p>
                  </Link>
                </>
              )}
            </div>

            {/* Language Switch */}
            <Dialog>
              <DialogTrigger asChild>
                <Button className="mt-2 w-full rounded-full bg-gray-100 text-black hover:bg-gray-200">
                  <Image alt="" src={Indonesia} width={24} />
                  <p className="ml-2">{t("language")}</p>
                </Button>
              </DialogTrigger>

              <DialogContent className="max-w-xs">
                <DialogHeader>
                  <DialogTitle>{t("chooseLanguage")}</DialogTitle>
                </DialogHeader>

                <div className="flex flex-col gap-3">
                  <Button
                    variant="outline"
                    onClick={() => {
                      router.push(`/id${cleanPath}`);
                      setOpen(false);
                    }}
                    className="flex items-center gap-2"
                  >
                    🇮🇩 Indonesia (IDR)
                  </Button>

                  <Button
                    variant="outline"
                    onClick={() => {
                      router.push(`/en${cleanPath}`);
                      setOpen(false);
                    }}
                    className="flex items-center gap-2"
                  >
                    🇺🇸 English (USD)
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navigationbar;

const CalculatorDropdownItem = ({
  title,
  desc,
  href,
}: {
  title: string;
  desc: string;
  href: string;
}) => {
  return (
    <Link
      href={href}
      className="group/item flex gap-3 rounded-lg p-3 transition hover:bg-rose-500/10"
    >
      <div className="text-primary flex h-8 w-8 items-center justify-center">
        <SquareChartGantt />
      </div>

      <div>
        <p className="text-sm font-semibold text-white">{title}</p>
        <p className="text-xs leading-relaxed text-gray-400">{desc}</p>
      </div>
    </Link>
  );
};
