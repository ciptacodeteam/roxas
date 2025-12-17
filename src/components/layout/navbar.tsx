/* eslint-disable react-hooks/rules-of-hooks */
"use client";

import { useState } from "react";
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

import logo from "public/img/logo.webp";
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

  const t = useTranslations("Navigation");
  const router = useRouter();
  const pathname = usePathname();

  const locale = pathname.split("/")[1] ?? "id";
  const cleanPath = pathname.replace(`/${locale}`, "") || "/";

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
            <Image alt="logo" src={logo} className="w-42" />
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
          <div className="flex gap-6">
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
