import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  reactStrictMode: true,
  images: {
    domains: ["api.dicebear.com", "res.cloudinary.com"],
  },
};

export default nextConfig;
