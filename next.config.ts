import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // This new 'remotePatterns' property is the modern way to allow external images.
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'firebasestorage.googleapis.com',
        port: '',
        pathname: '/**',
      },
    ],
  },
};

export default nextConfig;
