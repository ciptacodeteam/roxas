"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useAuth, useLogout } from "@/lib/auth";
import { useProfile } from "@/lib/profile";

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
  UserCircle,
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
import { useProducts } from "@/lib/queries";

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
  const pathname = usePathname();
  const { session, isLoading: isPending, isAdmin } = useAuth();
  const { logout } = useLogout({
    redirectTo: `/${pathname.split("/")[1] || "id"}`,
  });

  // Fetch profile data for avatar and name
  const { data: profile } = useProfile({
    enabled: !!session?.user && !isAdmin,
  });

  const t = useTranslations("Navigation");
  const router = useRouter();

  const locale = pathname.split("/")[1] ?? "id";
  const cleanPath = pathname.replace(`/${locale}`, "") || "/";

  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);

  // Get display name and image from profile or session
  const displayName =
    profile?.full_name || session?.user?.email?.split("@")[0] || "User";
  const displayImage = profile?.photo || undefined;
  const displayInitials = displayName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "auto";

    // CLEANUP (penting kalau pindah page)
    return () => {
      document.body.style.overflow = "auto";
    };
  }, [open]);

  const handleLogout = async () => {
    logout();
  };

  const toggleMenu = () => setOpen((s) => !s);

  const { data: products = [] } = useProducts({});

  const mappedProducts = products.map((product: any) => ({
    title: product.name,
    slug: product.slug,
    image: product.image,
    subtitle: product.category_name,
  }));

  const [query, setQuery] = useState("");
  const [showResult, setShowResult] = useState(false);

  const results = mappedProducts.filter((item) =>
    item.title?.toLowerCase().includes(query.toLowerCase()),
  );

  return (
    <nav className="bg-foreground fixed top-0 left-0 z-50 w-full text-white">
      <div className="mx-auto w-11/12 py-4 lg:max-w-7xl lg:px-4">
        {/* TOP SECTION */}
        <div className="flex items-center justify-between gap-4">
          {/* Logo */}
          <Link href={`/${locale}`} className="text-xl font-bold">
            <Image alt="logo" src={logo} className="w-38 lg:w-48" />
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
              className="w-full rounded-full border-gray-600 pl-10 text-white placeholder:text-gray-300"
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
                      className="hover:bg-primary/30 flex items-center gap-3 rounded-lg p-3"
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
                          {item.subtitle} 
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

          <div className="flex gap-3">
            <Dialog>
              <DialogTrigger asChild>
                <Button className="lg:bg-primary bg-foreground flex cursor-pointer items-center rounded-full border border-white/10 px-2 hover:bg-rose-500/90">
                  <Image
                    alt=""
                    src={locale === "en" ? uk : Indonesia}
                    className="w-5 lg:w-6"
                  />
                  <p className="ml-1 text-sm lg:text-base">{t("language")}</p>
                </Button>
              </DialogTrigger>

              <DialogContent className="max-w-xs border-0">
                <DialogHeader>
                  <DialogTitle className="text-white">
                    {t("chooseLanguage")}
                  </DialogTitle>
                </DialogHeader>

                <div className="flex w-full flex-col gap-3 lg:flex lg:flex-row">
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

            {/* Mobile Menu Button */}
            <div className="flex gap-2 lg:hidden">
              <div className="flex items-center gap-3">
                {/* SEARCH TOGGLE */}
                <button
                  onClick={() => setMobileSearchOpen((prev) => !prev)}
                  className="rounded-sm border border-white/10 p-1.5 text-white"
                >
                  {mobileSearchOpen ? <X size={20} /> : <Search size={20} />}
                </button>
              </div>
              <button
                onClick={toggleMenu}
                className="rounded-sm border border-white/10 p-1.5 text-white"
              >
                <Menu size={20} />
              </button>
            </div>
          </div>
        </div>

        {/* MOBILE SEARCH BAR */}
        {mobileSearchOpen && (
          <div className="mt-4 lg:hidden">
            <div className="relative">
              <Search className="absolute top-1/2 left-4 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <Input
                autoFocus
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setShowResult(true);
                }}
                placeholder="Cari Game atau Voucher"
                className="w-full rounded-full border-gray-50/20 pl-11 text-white placeholder:text-sm placeholder:text-gray-400"
              />
            </div>

            {/* SEARCH RESULT (MOBILE) */}
            {showResult && query && (
              <div className="mt-2 rounded-xl bg-[#141414] p-2 shadow-xl">
                {results.length > 0 ? (
                  results.slice(0, 6).map((item, i) => (
                    <Link
                      key={i}
                      href={`/${locale}/product/${item.slug}`}
                      onClick={() => {
                        setQuery("");
                        setShowResult(false);
                        setMobileSearchOpen(false);
                      }}
                      className="flex items-center gap-3 rounded-lg p-3 hover:bg-rose-500/10"
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
                          {item.subtitle} 
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
        )}

        {/* DESKTOP NAV */}
        <div className="flex items-center justify-between lg:mt-6">
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
          <div className="hidden items-center gap-6 md:flex">
            {isPending || isAdmin === null ? (
              <div className="text-sm text-gray-300">Loading...</div>
            ) : session?.user && !isAdmin ? (
              <div className="group relative">
                {/* TRIGGER BUTTON */}
                <button
                  type="button"
                  className="relative flex cursor-pointer items-center gap-2 text-sm text-gray-300 transition hover:text-white"
                >
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={displayImage} alt={displayName} />
                    <AvatarFallback className="bg-gray-700 text-white">
                      {displayInitials}
                    </AvatarFallback>
                  </Avatar>
                  <p className="font-medium text-white">{displayName}</p>
                </button>

                {/* DROPDOWN */}
                <div className="invisible absolute top-full right-0 z-50 mt-4 max-h-150 w-64 overflow-y-auto rounded-xl bg-[#141414] p-4 opacity-0 shadow-2xl transition-all duration-200 group-hover:visible group-hover:opacity-100">
                  {/* ARROW */}
                  <div className="absolute -top-2 right-6 h-4 w-4 rotate-45 bg-[#141414]" />

                  <div className="space-y-3">
                    {/* USER INFO */}
                    <div className="flex flex-col space-y-1 border-b border-gray-800 pb-2">
                      <p className="text-sm font-semibold text-white">
                        {displayName}
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
                        <p className="text-sm font-semibold text-white">
                          Profile
                        </p>
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
                        <p className="text-sm font-semibold text-white">
                          Transaction
                        </p>
                        <p className="text-xs text-gray-400">Order history</p>
                      </div>
                    </Link>

                    {/* SEPARATOR */}
                    <div className="border-t border-gray-800 pt-2"></div>

                    {/* LOGOUT BUTTON */}
                    <button
                      onClick={handleLogout}
                      className="group/item flex w-full cursor-pointer items-center gap-3 rounded-lg p-3 text-left transition hover:bg-red-500/10"
                    >
                      <div className="flex h-8 w-8 items-center justify-center text-red-400">
                        <LogOut className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-red-400">
                          Logout
                        </p>
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

      {/* MOBILE SIDEBAR */}
      <div
        className={`fixed inset-0 z-40 transition-opacity duration-300 md:hidden ${
          open
            ? "pointer-events-auto opacity-100"
            : "pointer-events-none opacity-0"
        }`}
      >
        {/* OVERLAY */}
        <div
          className="absolute inset-0 bg-black/60"
          onClick={() => setOpen(false)}
        />

        {/* SIDEBAR */}
        <aside
          className={`absolute top-0 left-0 h-screen w-[81%] max-w-sm transform bg-[#0f131a] transition-transform duration-300 ease-in-out ${open ? "translate-x-0" : "-translate-x-full"}`}
        >
          {/* HEADER */}
          <div className="flex items-center justify-between border-b border-gray-800 px-4 py-4">
            <Image src={logo} alt="logo" className="w-36" />
            <button onClick={() => setOpen(false)}>
              <X className="h-6 w-6 text-white" />
            </button>
          </div>

          {/* MENU */}
          <div className="space-y-4 px-4 py-6">
            {/* NAV ITEMS */}
            <MobileNavItem
              href={`/${locale}`}
              icon={Gamepad2}
              label="Topup"
              onClick={() => setOpen(false)}
            />

            {!isAdmin && (
              <MobileNavItem
                href={`/${locale}/transaction`}
                icon={ReceiptText}
                label="Cek Transaksi"
                onClick={() => setOpen(false)}
              />
            )}

            <MobileNavItem
              href={`/${locale}/leaderboard`}
              icon={ChartNoAxesColumn}
              label="Leaderboard"
              onClick={() => setOpen(false)}
            />

            <MobileNavItem
              href={`/${locale}/calculator`}
              icon={Calculator}
              label="Kalkulator"
              onClick={() => setOpen(false)}
            />

            <div className="my-4 border-t border-gray-800" />

            {/* AUTH */}
            {session?.user ? (
              <button
                onClick={handleLogout}
                className="flex items-center gap-3 text-red-400"
              >
                <LogOut className="h-5 w-5" />
                Logout
              </button>
            ) : (
              <>
                <MobileNavItem
                  href={`/${locale}/login`}
                  icon={LogIn}
                  label="Masuk"
                  onClick={() => setOpen(false)}
                />
                <MobileNavItem
                  href={`/${locale}/register`}
                  icon={UserRoundPlus}
                  label="Daftar"
                  onClick={() => setOpen(false)}
                />
              </>
            )}
          </div>
        </aside>
      </div>
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

const MobileNavItem = ({
  href,
  icon: Icon,
  label,
  onClick,
}: {
  href: string;
  icon: React.ElementType;
  label: string;
  onClick?: () => void;
}) => {
  return (
    <Link
      href={href}
      onClick={onClick}
      className="flex items-center gap-3 text-base text-white transition hover:text-rose-500"
    >
      <Icon className="h-5 w-5" />
      {label}
    </Link>
  );
};
