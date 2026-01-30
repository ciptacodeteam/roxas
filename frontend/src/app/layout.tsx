import "@/styles/globals.css";

import { type Metadata } from "next";
import { IBM_Plex_Sans_Condensed } from "next/font/google";
import { GoogleOAuthProvider } from "@react-oauth/google";

import { SessionProvider } from "@/components/auth/session-provider";
import { QueryProvider } from "@/components/providers/query-provider";
import { AuthProvider } from "@/lib/auth";
import { env } from "@/env";

export const metadata: Metadata = {
  title: "Roxas Games Store | Top Up Game Teraman",
  description: "Top up game teraman & terpercaya. Proses instan, harga murah, pembayaran lengkap, dan 100% aman. Roxas Games Store solusi top up game kamu.",
  icons: [{ rel: "icon", url: "/favicon.ico" }],
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

