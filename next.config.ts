import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    // Portfolio photo uploads from the admin panel (Vercel caps request bodies at 4.5 MB).
    serverActions: { bodySizeLimit: "4mb" },
  },
  // Portfolio only repeated the homepage reviews (no delivery photos or client stories yet), so
  // it sends visitors there. Temporary, so browsers don't cache it if the page comes back:
  // delete this redirect and re-add /portfolio to the menu, footer, sitemap and lib/kb/ingest.ts.
  async redirects() {
    return [{ source: "/portfolio", destination: "/#reviews", permanent: false }];
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
        ],
      },
    ];
  },
};

export default nextConfig;
