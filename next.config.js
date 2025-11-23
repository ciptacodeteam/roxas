/**
 * Run `build` or `dev` with `SKIP_ENV_VALIDATION` to skip env validation. This is especially useful
 * for Docker builds.
 */
// A. Import validasi environment Anda (dari blok 1)
import "./src/env.js"; 

// B. Import plugin next-intl (dari blok 2)
import createNextIntlPlugin from 'next-intl/plugin';

// Baris "import type" telah dihapus karena ini adalah file JS.

/** @type {import("next").NextConfig} */
// Anotasi tipe NextConfig menggunakan JSDoc (tetap memberikan type checking di editor)
const nextConfig = {
  // Masukkan konfigurasi Next.js dasar Anda di sini (misalnya, images, webpack, dll.)
  // Saat ini masih kosong, seperti pada blok 1 dan blok 2.
};

// C. Bungkus (wrap) konfigurasi dasar Anda dengan plugin next-intl
const withNextIntl = createNextIntlPlugin();

// D. Export hasil pembungkusan (dari blok 2)
export default withNextIntl(nextConfig);