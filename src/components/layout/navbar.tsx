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

type NavItem = {
  key: string; // key i18n
  href: string;
  icon?: React.ElementType;
};

const navItems: NavItem[] = [
  { key: "home", href: "/", icon: Gamepad2 },
  { key: "transaction", href: "/transaction", icon: ReceiptText },
  { key: "leaderboard", href: "/leaderboard", icon: ChartNoAxesColumn },
  { key: "calculator", href: "/calculator", icon: Calculator },
];

const Navigationbar = () => {
  const [open, setOpen] = useState(false);

  const t = useTranslations("Navigation");
  const router = useRouter();
  const pathname = usePathname();

  const locale = pathname.split("/")[1] ?? "id";
  const cleanPath = pathname.replace(`/${locale}`, "") || "/";

  const toggleMenu = () => setOpen((s) => !s);

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
              type="text"
              placeholder={t("searchPlaceholder")}
              className="border-ring/50 bg-muted-foreground w-full rounded-full pl-10 text-white placeholder:text-white"
            />
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
                    className={`flex flex-1 items-center gap-2 p-2 cursor-pointer ${locale === "id" ? "border-rose-500 text-rose-500" : "border-gray-600 text-white"} hover:bg-gray-800`}
                  >
                    <Image alt="" src={Indonesia} width={24} />
                    <p className="ml-1 text-white">Bahasa Indonesia</p>
                  </Button>

                  {/* English */}
                  <Button
                    variant="outline"
                    onClick={() => router.push(`/en${cleanPath}`)}
                    className={`flex flex-1 items-center gap-2 p-2 cursor-pointer ${locale === "en" ? "border-rose-500 text-rose-500" : "border-gray-600 text-white"} hover:bg-gray-800`}
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

              const active =
                item.href === "/"
                  ? cleanPath === "/"
                  : cleanPath.startsWith(item.href);

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
