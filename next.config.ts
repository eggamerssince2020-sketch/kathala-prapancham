import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // This tells Next.js to ignore ESLint errors during the build process.
  // It's useful for warnings like "unused variables" that can stop a deployment.
  eslint: {
    ignoreDuringBuilds: true,
  },
  
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
