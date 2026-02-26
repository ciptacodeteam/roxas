/**
 * SEO / Metadata helpers
 * Centralised factory for consistent meta tags across all pages.
 */

import type { Metadata } from "next";

const SITE_NAME = "Roxas Games Store";
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://roxasgamestore.com";
const DEFAULT_OG_IMAGE = `${SITE_URL}/img/og-default.webp`;

/** Shared Open Graph / Twitter base */
const baseOG = {
  siteName: SITE_NAME,
  locale: "id_ID",
  type: "website" as const,
};

const baseTwitter = {
  card: "summary_large_image" as const,
  site: "@roxasgamestore",
};

/** Robots value for private/auth pages */
export const NOINDEX = {
  index: false,
  follow: false,
} as const;

/**
 * Build a complete Metadata object for a page.
 *
 * @example
 * export const metadata = buildMeta({
 *   title: "Leaderboard",
 *   description: "Top 10 pembelian terbanyak bulan ini.",
 * });
 */
export function buildMeta({
  title,
  description,
  image = DEFAULT_OG_IMAGE,
  path = "",
  noindex = false,
  type = "website",
}: {
  title: string;
  description: string;
  image?: string;
  path?: string;
  noindex?: boolean;
  type?: "website" | "article";
}): Metadata {
  const fullTitle = `${title} | ${SITE_NAME}`;
  const url = `${SITE_URL}${path}`;

  return {
    title: fullTitle,
    description,
    metadataBase: new URL(SITE_URL),
    alternates: { canonical: url },
    openGraph: {
      ...baseOG,
      title: fullTitle,
      description,
      url,
      type,
      images: [{ url: image, width: 1200, height: 630, alt: title }],
    },
    twitter: {
      ...baseTwitter,
      title: fullTitle,
      description,
      images: [image],
    },
    robots: noindex ? NOINDEX : { index: true, follow: true },
  };
}
