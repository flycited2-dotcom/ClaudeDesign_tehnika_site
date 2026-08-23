import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "splithome.ru",
        pathname: "/static/cf-cards/**",
      },
    ],
  },
};

export default nextConfig;
