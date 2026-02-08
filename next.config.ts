import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Required for BlockNote compatibility with React 19
  reactStrictMode: false,
  images: {
    remotePatterns: [
      // Vercel Blob storage
      { protocol: 'https', hostname: '*.public.blob.vercel-storage.com' },
      // Google profile pictures
      { protocol: 'https', hostname: 'lh3.googleusercontent.com' },
      // Clerk avatars
      { protocol: 'https', hostname: 'img.clerk.com' },
      // Clerk user images
      { protocol: 'https', hostname: 'images.clerk.dev' },
    ],
  },
  // Turbopack config (Next.js 16 uses Turbopack by default)
  turbopack: {},
  // Suppress punycode deprecation warning (for webpack builds)
  webpack: (config) => {
    config.ignoreWarnings = [
      { module: /node_modules\/punycode/ }
    ];
    return config;
  },
};

export default nextConfig;


