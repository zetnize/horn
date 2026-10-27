import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  devIndicators: false,
  serverExternalPackages: ["googleapis", "pg"],
  outputFileTracingExcludes: { "/*": ["./storage/**/*"] },
};

export default nextConfig;
