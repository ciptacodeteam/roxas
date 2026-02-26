import "@/styles/globals.css";

import { type Metadata } from "next";
import { IBM_Plex_Sans_Condensed } from "next/font/google";
import { GoogleOAuthProvider } from "@react-oauth/google";

import { SessionProvider } from "@/components/auth/session-provider";
import { QueryProvider } from "@/components/providers/query-provider";
import { AuthProvider } from "@/lib/auth";
import { env } from "@/env";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://roxasgamestore.com";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Roxas Games Store | Top Up Game Teraman & Terpercaya",
    template: "%s | Roxas Games Store",
  },
  description:
    "Top up game teraman & terpercaya. Proses instan, harga murah, pembayaran lengkap, dan 100% aman. Roxas Games Store solusi top up game kamu.",
  keywords: [
    "top up game",
    "top up mobile legends",
    "top up free fire",
    "beli diamond murah",
    "roxas games store",
    "top up teraman",
    "voucher game",
  ],
  authors: [{ name: "Roxas Games Store", url: SITE_URL }],
  creator: "Roxas Games Store",
  publisher: "Roxas Games Store",
  icons: [{ rel: "icon", url: "/favicon.ico" }],
  openGraph: {
    type: "website",
    locale: "id_ID",
    url: SITE_URL,
    siteName: "Roxas Games Store",
    title: "Roxas Games Store | Top Up Game Teraman & Terpercaya",
    description:
      "Top up game teraman & terpercaya. Proses instan, harga murah, pembayaran lengkap, dan 100% aman.",
    images: [
      {
        url: "/img/og-default.webp",
        width: 1200,
        height: 630,
        alt: "Roxas Games Store",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    site: "@roxasgamestore",
    title: "Roxas Games Store | Top Up Game Teraman & Terpercaya",
    description:
      "Top up game teraman & terpercaya. Proses instan, harga murah, pembayaran lengkap, dan 100% aman.",
    images: ["/img/og-default.webp"],
  },
  robots: { index: true, follow: true },
};

// FONT: IBM PLEX SANS CONDENSED
const ibmPlex = IBM_Plex_Sans_Condensed({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-ibm-condensed",
});

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const googleClientId = env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
  
  return (
    <html lang="en" className={ibmPlex.variable}>
      <body className="font-ibm">
        <QueryProvider>
          {googleClientId ? (
            <GoogleOAuthProvider clientId={googleClientId}>
              <AuthProvider>
                <SessionProvider>
                  {children}
                </SessionProvider>
              </AuthProvider>
            </GoogleOAuthProvider>
          ) : (
            <AuthProvider>
              <SessionProvider>
                {children}
              </SessionProvider>
            </AuthProvider>
          )}
        </QueryProvider>
      </body>
    </html>
  );
}

