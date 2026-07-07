import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'standalone', // Trims node_modules and cache down to the absolute essentials
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      {
        protocol: 'https',
        hostname: 'placehold.co',
      },
    ],
  },
};

export default nextConfig;