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
  ChevronDown,
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

import { useProductSearch } from "@/lib/products/queries";
import { useDebounce } from "@/hooks/useDebounce";
import { getProductImage } from "@/lib/utils";

type NavItem = {
  key: string;
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

  const { data: profile } = useProfile({
    enabled: !!session?.user && !isAdmin,
  });

  const t = useTranslations("Navigation");

  const router = useRouter();

  const locale = pathname.split("/")[1] ?? "id";

  const cleanPath = pathname.replace(`/${locale}`, "") || "/";

  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);

  const [mobileCalcOpen, setMobileCalcOpen] = useState(false);

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

    return () => {
      document.body.style.overflow = "auto";
    };
  }, [open]);

  const handleLogout = async () => {
    logout();
  };

  const toggleMenu = () => setOpen((s) => !s);

  const [query, setQuery] = useState("");

  const [showResult, setShowResult] = useState(false);

  const debouncedQuery = useDebounce(query, 300);

  const { data: searchResults = [], isLoading: isSearching } =
    useProductSearch(debouncedQuery, {
      enabled: debouncedQuery.length >= 2,
    });

  return (
    <nav className="bg-foreground fixed top-0 left-0 z-50 w-full border-b border-white/5 text-white backdrop-blur-xl">
      <div className="mx-auto w-11/12 py-4 lg:max-w-7xl lg:px-4">
        {/* TOP */}
        <div className="flex items-center justify-between gap-4">
          {/* LOGO */}
          <Link href={`/${locale}`}>
            <Image
              alt="logo"
              src={logo}
              className="w-32 lg:w-44"
              priority
            />
          </Link>

          {/* SEARCH DESKTOP */}
          <div className="relative hidden flex-1 lg:block">
            <Search className="absolute top-1/2 left-4 h-4 w-4 -translate-y-1/2 text-gray-400" />

            <Input
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setShowResult(true);
              }}
              onFocus={() => setShowResult(true)}
              placeholder="Cari game atau produk"
              className="h-11 rounded-full border-white/10 bg-white/5 pl-11 text-white placeholder:text-gray-400"
            />

            {showResult && query && (
              <div className="absolute top-full z-50 mt-3 w-full rounded-2xl border border-white/10 bg-[#141414] p-2 shadow-2xl">
                {isSearching ? (
                  <p className="p-3 text-sm text-gray-400">Mencari...</p>
                ) : searchResults.length > 0 ? (
                  searchResults.slice(0, 6).map((product) => (
                    <Link
                      key={product.id}
                      href={`/${locale}/product/${product.slug}`}
                      onClick={() => {
                        setQuery("");
                        setShowResult(false);
                      }}
                      className="flex items-center gap-3 rounded-xl p-3 transition hover:bg-white/5"
                    >
                      <Image
                        src={getProductImage(product.image, product.slug)}
                        alt={product.name}
                        width={44}
                        height={44}
                        className="rounded-lg object-cover"
                      />

                      <div>
                        <p className="text-sm font-semibold text-white">
                          {product.name}
                        </p>

                        <p className="text-xs text-gray-400">
                          {product.category_name}
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

          {/* RIGHT */}
          <div className="flex items-center gap-3">
            {/* LANGUAGE */}
            <Dialog>
              <DialogTrigger asChild>
                <Button className="bg-white/5 hover:bg-white/10 rounded-full border border-white/10 px-3">
                  <Image
                    alt=""
                    src={locale === "en" ? uk : Indonesia}
                    className="w-5"
                  />

                  <p className="ml-1 text-sm">{t("language")}</p>
                </Button>
              </DialogTrigger>

              <DialogContent className="border-white/10 bg-[#111]">
                <DialogHeader>
                  <DialogTitle className="text-white">
                    {t("chooseLanguage")}
                  </DialogTitle>
                </DialogHeader>

                <div className="flex flex-col gap-3">
                  <Button
                    variant="outline"
                    onClick={() => router.push(`/id${cleanPath}`)}
                    className="border-white/10 bg-transparent text-white hover:bg-white/5"
                  >
                    <Image alt="" src={Indonesia} width={20} />
                    Bahasa Indonesia
                  </Button>

                  <Button
                    variant="outline"
                    onClick={() => router.push(`/en${cleanPath}`)}
                    className="border-white/10 bg-transparent text-white hover:bg-white/5"
                  >
                    <Image alt="" src={uk} width={20} />
                    English
                  </Button>
                </div>
              </DialogContent>
            </Dialog>

            {/* MOBILE BUTTONS */}
            <div className="flex items-center gap-2 lg:hidden">
              <button
                onClick={() => setMobileSearchOpen((prev) => !prev)}
                className="rounded-lg border border-white/10 bg-white/5 p-2"
              >
                {mobileSearchOpen ? <X size={20} /> : <Search size={20} />}
              </button>

              <button
                onClick={toggleMenu}
                className="rounded-lg border border-white/10 bg-white/5 p-2"
              >
                <Menu size={20} />
              </button>
            </div>
          </div>
        </div>

        {/* MOBILE SEARCH */}
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
                className="h-11 rounded-full border-white/10 bg-white/5 pl-11 text-white"
              />
            </div>
          </div>
        )}

        {/* DESKTOP NAV */}
        <div className="mt-6 hidden items-center justify-between lg:flex">
          {/* LEFT MENU */}
          <div className="flex items-center gap-8">
            {navItems.map((item) => {
              const Icon = item.icon;

              if (item.key === "transaction" && isAdmin) {
                return null;
              }

              const active = cleanPath === item.href;

              return (
                <Link
                  key={item.key}
                  href={`/${locale}${item.href}`}
                  className={`flex items-center gap-2 text-sm transition ${active
                      ? "font-semibold text-rose-500"
                      : "text-gray-300 hover:text-white"
                    }`}
                >
                  {Icon && <Icon className="h-5 w-5" />}

                  {t(item.key)}
                </Link>
              );
            })}
          </div>

          {/* RIGHT AUTH */}
          <div className="flex items-center gap-5">
            {session?.user && !isAdmin ? (
              <div className="flex items-center gap-3">
                <Avatar className="size-9">
                  <AvatarImage src={displayImage} />

                  <AvatarFallback>{displayInitials}</AvatarFallback>
                </Avatar>

                <span className="text-sm font-medium text-white">
                  {displayName}
                </span>

                <button
                  onClick={handleLogout}
                  className="text-sm text-red-400 hover:text-red-300"
                >
                  Logout
                </button>
              </div>
            ) : (
              <>
                <Link
                  href={`/${locale}/login`}
                  className="flex items-center gap-2 text-sm text-gray-300 hover:text-white"
                >
                  <LogIn className="h-5 w-5" />
                  Login
                </Link>

                <Link
                  href={`/${locale}/register`}
                  className="rounded-full bg-rose-500 px-5 py-2 text-sm font-medium text-white transition hover:bg-rose-600"
                >
                  Register
                </Link>
              </>
            )}
          </div>
        </div>
      </div>

      {/* MOBILE SIDEBAR */}
      <div
        className={`fixed inset-0 z-40 transition-opacity duration-300 lg:hidden ${open
            ? "pointer-events-auto opacity-100"
            : "pointer-events-none opacity-0"
          }`}
      >
        {/* OVERLAY */}
        <div
          className="absolute inset-0 bg-black/70 backdrop-blur-sm"
          onClick={() => setOpen(false)}
        />

        {/* SIDEBAR */}
        <aside
          className={`absolute top-0 left-0 h-screen w-[82%] max-w-sm transform border-r border-white/10 bg-[#0b0f14] transition-transform duration-300 ease-out ${open ? "translate-x-0" : "-translate-x-full"
            }`}
        >
          {/* HEADER */}
          <div className="flex items-center justify-between border-b border-white/10 px-4 py-5">
            <Image src={logo} alt="logo" className="w-32" />

            <button
              onClick={() => setOpen(false)}
              className="rounded-lg border border-white/10 bg-white/5 p-2"
            >
              <X className="h-5 w-5 text-white" />
            </button>
          </div>

          {/* MENU */}
          <div className="space-y-5 px-5 py-6">
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

            {/* CALCULATOR */}
            <div>
              <button
                onClick={() => setMobileCalcOpen((prev) => !prev)}
                className="flex w-full items-center justify-between text-white"
              >
                <div className="flex items-center gap-3">
                  <Calculator className="h-5 w-5" />
                  Kalkulator
                </div>

                <ChevronDown
                  className={`transition ${mobileCalcOpen ? "rotate-180" : ""
                    }`}
                />
              </button>

              {mobileCalcOpen && (
                <div className="mt-4 ml-7 space-y-4">
                  <MobileNavItem
                    href={`/${locale}/calculator/winrate`}
                    icon={SquareChartGantt}
                    label="Win Rate"
                    onClick={() => setOpen(false)}
                  />

                  <MobileNavItem
                    href={`/${locale}/calculator/magicwheel`}
                    icon={SquareChartGantt}
                    label="Magic Wheel"
                    onClick={() => setOpen(false)}
                  />

                  <MobileNavItem
                    href={`/${locale}/calculator/zodiac`}
                    icon={SquareChartGantt}
                    label="Zodiac"
                    onClick={() => setOpen(false)}
                  />
                </div>
              )}
            </div>

            <div className="border-t border-white/10 pt-5">
              {session?.user && !isAdmin ? (
                <>
                  <MobileNavItem
                    href={`/${locale}/profile`}
                    icon={UserCircle}
                    label="Profile"
                    onClick={() => setOpen(false)}
                  />

                  <div className="mt-5">
                    <button
                      onClick={() => {
                        handleLogout();
                        setOpen(false);
                      }}
                      className="flex items-center gap-3 text-red-400"
                    >
                      <LogOut className="h-5 w-5" />
                      Logout
                    </button>
                  </div>
                </>
              ) : (
                <div className="space-y-5">
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
                </div>
              )}
            </div>
          </div>
        </aside>
      </div>
    </nav>
  );
};

export default Navigationbar;

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