import './src/env.js';
import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin();

/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.public.blob.vercel-storage.com',
      },
    ],
  },
  // Disable source maps to avoid Turbopack source map parsing errors
  productionBrowserSourceMaps: false,
};

export default withNextIntl(nextConfig);
