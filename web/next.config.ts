import type { NextConfig } from "next";
import path from "node:path";

const nextConfig: NextConfig = {
  turbopack: { root: path.join(__dirname, '..') },
  compress: true,
  poweredByHeader: false,
  images: {
    formats: ['image/avif', 'image/webp'],
  },
  experimental: {
    optimizePackageImports: ['lucide-react'],
  },
};

export default nextConfig;
