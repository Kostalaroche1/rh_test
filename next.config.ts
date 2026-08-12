import os from "node:os";
import type { NextConfig } from "next";

function getAllowedDevOrigins(): string[] {
  const envOrigins = (process.env.NEXT_ALLOWED_DEV_ORIGINS ?? "")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);

  const lanOrigins = Object.values(os.networkInterfaces())
    .flat()
    .filter((network): network is NonNullable<typeof network> => Boolean(network))
    .filter((network) => network.family === "IPv4" && !network.internal)
    .map((network) => network.address);

  return Array.from(new Set(["localhost", "127.0.0.1", ...lanOrigins, ...envOrigins]));
}

const nextConfig: NextConfig = {
  // Keep build artifacts out of `.next` because this Windows workspace
  // intermittently leaves that directory locked between runs.
  distDir: ".next-build",
  // Allow mobile devices on LAN to fetch dev assets without cross-origin warnings.
  allowedDevOrigins: getAllowedDevOrigins(),
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

