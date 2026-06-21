const { z } = require("zod");

z.object({
  NEXT_PUBLIC_API_URL: z.string().url().default("http://localhost:4000"),
  NEXT_PUBLIC_WS_URL: z.string().url().default("http://localhost:4000"),
}).parse(process.env);

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ["@mtk/ui", "@mtk/database"],
  eslint: {
    ignoreDuringBuilds: false,
  },
  typescript: {
    ignoreBuildErrors: false,
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**.supabase.co",
      },
      {
        protocol: "https",
        hostname: "**.clerk.dev",
      },
      {
        protocol: "https",
        hostname: "img.clerk.com",
      },
    ],
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(self), geolocation=()" },
        ],
      },
    ];
  },
};

// Only wrap with Sentry in production builds.
// In dev mode, Sentry's withSentryConfig breaks Turbopack by injecting
// client-side instrumentation when the SDK isn't available in the browser,
// causing "(void 0) is not a function" runtime errors on every component.
const isDev = process.env.NODE_ENV !== "production";

if (isDev) {
  module.exports = nextConfig;
} else {
  const { withSentryConfig } = require("@sentry/nextjs");
  module.exports = withSentryConfig(nextConfig, {
    org: process.env.SENTRY_ORG || "shakir-super-league",
    project: process.env.SENTRY_PROJECT || "ssl-web",
    silent: !process.env.CI,
    widenClientFileUpload: true,
    reactComponentAnnotation: {
      enabled: true,
    },
    tunnelRoute: "/monitoring",
    hideSourceMaps: true,
    disableLogger: true,
    automaticVercelMonitors: true,
  });
}
