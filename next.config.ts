import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typescript: {
    // Bỏ qua lỗi TypeScript trong quá trình build trên Vercel
    ignoreBuildErrors: true,
  },
  devIndicators: false,
};

export default nextConfig;
