import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {
      root: "../..",
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "drive.google.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "images.unsplash.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "*.googleapis.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "maps.apple.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "*.openstreetmap.org",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "example.com",
        pathname: "/**",
      },
      {
        protocol: "http",
        hostname: "example.com",
        pathname: "/**",
      },
    ],
  },
};

export default nextConfig;
