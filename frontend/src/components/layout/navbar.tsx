"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { useTranslations } from "next-intl";

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

import logo from "public/img/logo1.webp";
import Indonesia from "public/img/indonesia-logo.webp";
import uk from "public/img/uk-logo.webp";

import { useProductSearch } from "@/lib/products/queries";
import { useDebounce } from "@/hooks/useDebounce";
import { getProductImage } from "@/lib/utils";

const Navigationbar = () => {
  const [open, setOpen] = useState(false);

  const pathname = usePathname();

  const t = useTranslations("Navigation");

  const router = useRouter();

  const locale = pathname.split("/")[1] ?? "id";

  const cleanPath = pathname.replace(`/${locale}`, "") || "/";

  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);

  const [mobileCalcOpen, setMobileCalcOpen] = useState(false);

  const [query, setQuery] = useState("");

  const [showResult, setShowResult] = useState(false);

  const debouncedQuery = useDebounce(query, 300);

  const { data: searchResults = [], isLoading: isSearching } =
    useProductSearch(debouncedQuery, {
      enabled: debouncedQuery.length >= 2,
    });

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "auto";

    return () => {
      document.body.style.overflow = "auto";
    };
  }, [open]);

  return (
    <nav className="bg-foreground fixed top-0 left-0 z-50 w-full border-b border-white/5 text-white backdrop-blur-xl">
      <div className="mx-auto w-11/12 py-4 xl:max-w-7xl xl:px-4">
        {/* TOP */}
        <div className="flex items-center justify-between gap-4">
          {/* LOGO */}
          <Link href={`/${locale}`}>
            <Image
              alt="logo"
              src={logo}
              className="w-32 xl:w-44"
              priority
            />
          </Link>

          {/* SEARCH DESKTOP */}
          <div className="relative hidden flex-1 xl:block">
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

            {/* RESULT */}
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
                <Button className="rounded-full border border-white/10 bg-white/5 px-3 hover:bg-white/10">
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

            {/* MOBILE BUTTON */}
            <div className="flex items-center gap-2 xl:hidden">
              {/* SEARCH */}
              <button
                onClick={() => setMobileSearchOpen((prev) => !prev)}
                className="rounded-lg border border-white/10 bg-white/5 p-2"
              >
                {mobileSearchOpen ? <X size={20} /> : <Search size={20} />}
              </button>

              {/* MENU */}
              <button
                onClick={() => setOpen(true)}
                className="rounded-lg border border-white/10 bg-white/5 p-2"
              >
                <Menu size={20} />
              </button>
            </div>
          </div>
        </div>

        {/* MOBILE SEARCH */}
        {mobileSearchOpen && (
          <div className="mt-4 xl:hidden">
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

            {/* MOBILE RESULT */}
            {showResult && query && (
              <div className="mt-3 rounded-2xl border border-white/10 bg-[#141414] p-2 shadow-2xl">
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
                        setMobileSearchOpen(false);
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
        )}

        {/* DESKTOP NAV */}
        <div className="mt-6 hidden items-center justify-between xl:flex">
          <div className="flex items-center gap-8">
            <DesktopNavItem
              href={`/${locale}`}
              icon={Gamepad2}
              label="Topup"
            />

            <DesktopNavItem
              href={`/${locale}/transaction`}
              icon={ReceiptText}
              label="Transaction"
            />

            <DesktopNavItem
              href={`/${locale}/leaderboard`}
              icon={ChartNoAxesColumn}
              label="Leaderboard"
            />

            {/* CALCULATOR */}
            <div className="group relative">
              <button className="flex items-center gap-2 text-sm text-gray-300 transition hover:text-white">
                <Calculator className="h-5 w-5" />
                Calculator
              </button>

              {/* DROPDOWN */}
              <div className="invisible absolute top-full left-0 z-50 mt-5 w-80 rounded-2xl border border-white/10 bg-[#141414] p-3 opacity-0 shadow-2xl transition-all duration-200 group-hover:visible group-hover:opacity-100">
                <div className="space-y-2">
                  <CalculatorDropdownItem
                    title="Win Rate"
                    href={`/${locale}/calculator/winrate`}
                  />

                  <CalculatorDropdownItem
                    title="Magic Wheel"
                    href={`/${locale}/calculator/magicwheel`}
                  />

                  <CalculatorDropdownItem
                    title="Zodiac"
                    href={`/${locale}/calculator/zodiac`}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* MOBILE SIDEBAR */}
      <div
        className={`fixed inset-0 z-40 transition-opacity duration-300 xl:hidden ${open
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
          className={`absolute top-0 left-0 h-screen w-[340px] max-w-[85%] transform border-r border-white/10 bg-[#0b0f14] transition-transform duration-300 ease-out ${open ? "translate-x-0" : "-translate-x-full"
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

            <MobileNavItem
              href={`/${locale}/transaction`}
              icon={ReceiptText}
              label="Cek Transaksi"
              onClick={() => setOpen(false)}
            />

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

              {/* SUBMENU */}
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
            </div>
          </div>
        </aside>
      </div>
    </nav>
  );
};

export default Navigationbar;

/* =========================
   DESKTOP NAV ITEM
========================= */

const DesktopNavItem = ({
  href,
  icon: Icon,
  label,
}: {
  href: string;
  icon: React.ElementType;
  label: string;
}) => {
  return (
    <Link
      href={href}
      className="flex items-center gap-2 text-sm text-gray-300 transition hover:text-white"
    >
      <Icon className="h-5 w-5" />
      {label}
    </Link>
  );
};

/* =========================
   CALCULATOR ITEM
========================= */

const CalculatorDropdownItem = ({
  title,
  href,
}: {
  title: string;
  href: string;
}) => {
  return (
    <Link
      href={href}
      className="flex items-center gap-3 rounded-xl p-3 transition hover:bg-white/5"
    >
      <SquareChartGantt className="h-5 w-5 text-rose-500" />

      <p className="text-sm font-medium text-white">{title}</p>
    </Link>
  );
};

/* =========================
   MOBILE NAV ITEM
========================= */

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