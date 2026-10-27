import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  devIndicators: false,
  serverExternalPackages: ["googleapis"],
  outputFileTracingExcludes: { "/*": ["./storage/**/*"] },
};

export default nextConfig;
