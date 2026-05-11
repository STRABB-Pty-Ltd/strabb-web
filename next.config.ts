import type { NextConfig } from "next";

const INTERNAL_API_URL = process.env.INTERNAL_API_URL ?? "http://localhost:8000";

const nextConfig: NextConfig = {
  output: "standalone",
  async rewrites() {
    return [
      {
        source: "/be/:path*",
        destination: `${INTERNAL_API_URL}/:path*`,
      },
      {
        // Public share links resolve to the backend's PDF endpoint without
        // exposing the api hostname. Backend's _build_public_url uses
        // FRONTEND_BASE_URL, so the URL shape is /share/{token} on the
        // frontend domain - this rewrite is what makes that resolve.
        source: "/share/:token",
        destination: `${INTERNAL_API_URL}/share/:token`,
      },
    ];
  },
};

export default nextConfig;
