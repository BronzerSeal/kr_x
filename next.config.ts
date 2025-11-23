import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,

  // 👉 Добавляем сюда
  typescript: {
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
