import type { NextConfig } from "next";

const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
];

// The admin panel renders live database counts. Browsers, proxies and CDNs must
// never replay a cached copy, otherwise the dashboard keeps showing an older
// article total than the database actually holds.
const noStoreHeaders = [
  { key: "Cache-Control", value: "private, no-cache, no-store, max-age=0, must-revalidate" },
  { key: "Pragma", value: "no-cache" },
  { key: "Expires", value: "0" },
  { key: "CDN-Cache-Control", value: "no-store" },
  { key: "Cloudflare-CDN-Cache-Control", value: "no-store" },
];

const nextConfig: NextConfig = {
  poweredByHeader: false,
  trailingSlash: false,
  output: process.env.NEXT_OUTPUT === "standalone" ? "standalone" : undefined,
  // Cover images are 1200x675 JPEGs; next/image resizes them per slot and negotiates AVIF first.
  images: {
    formats: ["image/avif", "image/webp"],
    minimumCacheTTL: 604800,
  },
  // Keep bcryptjs as a real node_modules package so the standalone image can also run prisma/seed.mjs.
  serverExternalPackages: ["bcryptjs"],
  experimental: {
    serverActions: { bodySizeLimit: "10mb" },
  },
  async redirects() {
    return [
      // Author slug was fixed from the "Edword" typo; keep the old profile URL alive.
      { source: "/author/edword", destination: "/author/edward", permanent: true },
    ];
  },
  async headers() {
    return [
      { source: "/:path*", headers: securityHeaders },
      { source: "/admin/:path*", headers: [{ key: "X-Robots-Tag", value: "noindex, nofollow" }, ...noStoreHeaders] },
      { source: "/api/:path*", headers: noStoreHeaders },
    ];
  },
};

export default nextConfig;
