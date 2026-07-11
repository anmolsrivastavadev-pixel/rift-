import type { NextConfig } from "next";
import path from "node:path";

/* Security headers (audit response, July 2026). The app has no third-party
 * runtime origins — fonts are self-hosted by next/font, there are no
 * analytics scripts, and Stripe is reached only by a server-side redirect to
 * its hosted pages — so the CSP below is close to fully locked down.
 * 'unsafe-inline' remains in script-src/style-src because Next.js boots with
 * inline scripts and the landing page uses inline style attributes; a
 * nonce-based policy would require middleware and is the known upgrade path.
 * checkout/billing.stripe.com sit in form-action because the billing server
 * actions answer a form POST with a 303 to Stripe's hosted checkout, and
 * Chrome enforces form-action across that redirect (billing is dormant while
 * FREE_BETA is on, but must not break when it's flipped off).
 * HSTS is already served by Vercel at the platform level.
 */
const securityHeaders = [
  {
    key: "Content-Security-Policy",
    value: [
      "default-src 'self'",
      // React dev mode needs eval for debugging; production stays eval-free
      process.env.NODE_ENV === "development"
        ? "script-src 'self' 'unsafe-inline' 'unsafe-eval'"
        : "script-src 'self' 'unsafe-inline'",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: blob:",
      "media-src 'self'",
      "font-src 'self'",
      "connect-src 'self'",
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self' https://checkout.stripe.com https://billing.stripe.com",
      "frame-ancestors 'none'",
    ].join("; "),
  },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value:
      "camera=(), microphone=(), geolocation=(), payment=(), usb=(), accelerometer=(), gyroscope=(), magnetometer=()",
  },
];

const nextConfig: NextConfig = {
  turbopack: {
    root: path.resolve(__dirname),
  },
  experimental: {
    serverActions: {
      bodySizeLimit: "10mb",
    },
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;
