import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Pin the workspace root: a stray lockfile in $HOME otherwise makes Next
  // infer the wrong root directory.
  turbopack: { root: __dirname },
  // Reverse-proxy PostHog through our own origin so ad blockers don't drop
  // analytics. US cloud hosts — switch to eu.i / eu-assets for EU region.
  async rewrites() {
    return [
      {
        source: "/ingest/static/:path*",
        destination: "https://us-assets.i.posthog.com/static/:path*",
      },
      {
        source: "/ingest/:path*",
        destination: "https://us.i.posthog.com/:path*",
      },
    ];
  },
  // PostHog needs the trailing-slash-free path preserved through the proxy.
  skipTrailingSlashRedirect: true,
};

export default nextConfig;
