import "./src/env.js";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin();

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone", // For Docker production builds
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.public.blob.vercel-storage.com",
      },
      {
        protocol: 'https',
        hostname: 'api.sandbox.midtrans.com',
      },
      {
        protocol: 'https',
        hostname: 'api.midtrans.com',
      },
    ],
  },
  // Allow ngrok URLs in development
  allowedDevOrigins: process.env.WEBHOOK_BASE_URL
    ? [process.env.WEBHOOK_BASE_URL]
    : [],
  // Disable source maps to avoid Turbopack source map parsing errors
  productionBrowserSourceMaps: false,
};

export default withNextIntl(nextConfig);
