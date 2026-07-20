import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Pin the workspace root: a stray lockfile in $HOME otherwise makes Next
  // infer the wrong root directory.
  turbopack: { root: __dirname },
};

export default nextConfig;
