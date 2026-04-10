import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "euk6y5si9i.ufs.sh",
      },
    ],
  },
};

export default nextConfig;
