import type { NextConfig } from "next";

// The website owns the domain root (trysidekick.ca). The app itself is a separate
// Next.js project served under /app-demo (its basePath). When APP_DEMO_ORIGIN is
// set, e.g. https://sidekick-app-demo.vercel.app, this site proxies /app-demo to
// it, so both live on one domain (Next.js "multi-zones", see docs/deployment.md).
const APP_DEMO_ORIGIN = process.env.APP_DEMO_ORIGIN?.replace(/\/+$/, "");

// App screens that used to live at the domain root, before the app moved under
// /app-demo. Old links and home-screen shortcuts keep working.
const LEGACY_APP_PATHS = ["login", "setup", "discover", "inbox", "matches", "people", "profile", "settings", "chat", "deactivated"];

const SECURITY_HEADERS = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), interest-cohort=()" },
];

const nextConfig: NextConfig = {
  poweredByHeader: false,

  async headers() {
    return [{ source: "/:path*", headers: SECURITY_HEADERS }];
  },

  async redirects() {
    if (!APP_DEMO_ORIGIN) return [];
    return LEGACY_APP_PATHS.map((first) => ({ source: `/${first}/:rest*`, destination: `/app-demo/${first}/:rest*`, permanent: false }));
  },

  async rewrites() {
    if (!APP_DEMO_ORIGIN) return [];
    return [
      { source: "/app-demo", destination: `${APP_DEMO_ORIGIN}/app-demo` },
      { source: "/app-demo/:path+", destination: `${APP_DEMO_ORIGIN}/app-demo/:path+` },
    ];
  },
};

export default nextConfig;
