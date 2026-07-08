import type { NextConfig } from "next";

const INTERNAL_API_URL = process.env.INTERNAL_API_URL ?? "http://localhost:8000";

// Security response headers (F.2). CSP ships in Report-Only first so a QA
// soak can surface violations before it is switched to enforcing in a
// follow-up. HSTS is emitted only for production builds (local `next dev`
// runs over http and must not be pinned to https). Sentry's ingest origin is
// added to connect-src when F.6a lands.
const isProd = process.env.NODE_ENV === "production";

const cspReportOnly = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob:",
  "font-src 'self' data:",
  "connect-src 'self'",
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
].join("; ");

const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "geolocation=(), microphone=(), camera=()" },
  { key: "Content-Security-Policy-Report-Only", value: cspReportOnly },
  ...(isProd
    ? [{ key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains" }]
    : []),
];

const nextConfig: NextConfig = {
  output: "standalone",
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
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
