import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "pub-5d0fe94a3da5458ca88e4e79220a6798.r2.dev",
      },
    ],
  },
};

export default nextConfig;
