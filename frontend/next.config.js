import "./src/env.js";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin();

/** @type {import('next').NextConfig} */
const nextConfig = {
  // "standalone" is for Docker deployments only — Vercel manages its own output
  ...(process.env.VERCEL ? {} : { output: "standalone" }),

  webpack: (config, { dev, isServer }) => {
    if (dev && !isServer) {
      config.watchOptions = {
        ...config.watchOptions,
        ignored: /node_modules/,
      };
    }
    return config;
  },
  images: {
    remotePatterns: [
      {
        protocol: "http",
        hostname: "localhost",
        port: "8000",
      },
      {
        protocol: "https",
        // hostname: "*.public.blob.vercel-storage.com", // Removed - using local storage
        hostname: "localhost",
      },
      {
        protocol: "https",
        hostname: "data.roxasgamestore.com",
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
    // Allow unoptimized images from localhost in development
    unoptimized: process.env.NODE_ENV === 'development',
  },
  // Allow ngrok URLs in development
  allowedDevOrigins: process.env.WEBHOOK_BASE_URL
    ? [process.env.WEBHOOK_BASE_URL]
    : [],
  // Disable source maps to avoid Turbopack source map parsing errors
  productionBrowserSourceMaps: false,
};

export default withNextIntl(nextConfig);
