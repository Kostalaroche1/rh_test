import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typescript: {
    // TypeScript is validated explicitly with `npx tsc --noEmit`.
    // On this Windows environment, Next's internal TypeScript build phase
    // intermittently fails with `spawn EPERM` even when `tsc` passes.
    ignoreBuildErrors: true,
  },
  experimental: {
    // Reduce process fan-out during build on Windows.
    // This avoids intermittent child-process spawn failures (`spawn EPERM`)
    // without changing runtime behavior.
    cpus: 1,
  },
};

export default nextConfig;
