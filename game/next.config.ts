import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactCompiler: true,
  async rewrites() {
    return [
      { source: "/", destination: "/demo/bounty-bear.html" },
      { source: "/audio/:file*", destination: "/demo/audio/:file*" },
    ];
  },
};

export default nextConfig;
