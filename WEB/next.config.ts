import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  cacheComponents: true,
  partialPrefetching: true,
  // CRM uploads go through server actions: photos are capped at 8 MB, booking documents at 15 MB
  experimental: { serverActions: { bodySizeLimit: "16mb" } },
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com" },
      // photos uploaded from the CRM (Supabase Storage, public bucket)
      { protocol: "https", hostname: "*.supabase.co", pathname: "/storage/v1/object/public/alsafr-media/**" },
    ],
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
