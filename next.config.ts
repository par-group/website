import type { NextConfig } from "next";
import { SITE } from "./src/lib/site";

// The website owns the domain root (trysidekick.ca). The app itself is a separate
// Next.js project served under /app-demo (its basePath). When APP_DEMO_ORIGIN is
// set, e.g. https://sidekick-app-demo.vercel.app, this site proxies /app-demo to
// it, so both live on one domain (Next.js "multi-zones", see docs/deployment.md).
const APP_DEMO_ORIGIN = process.env.APP_DEMO_ORIGIN?.replace(/\/+$/, "");

// App screens that used to live at the domain root, before the app moved under
// /app-demo. Old links and home-screen shortcuts keep working.
const LEGACY_APP_PATHS = ["login", "setup", "discover", "inbox", "matches", "people", "profile", "settings", "chat", "deactivated"];

// The site lives on www.trysidekick.ca, and the apex (trysidekick.ca) redirects to it.
// That redirect is done here rather than by Vercel's domain settings, because app
// links need /.well-known on both hosts without a redirect: Apple and Google check
// each host a link uses, and invite links use the apex (see src/server/app-links.ts).
const SITE_HOST = new URL(SITE.url).host;
const APEX_HOST = SITE_HOST.replace(/^www\./, "");

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
    const apexToWww = {
      source: "/:path((?!\\.well-known/).*)",
      has: [{ type: "host" as const, value: APEX_HOST }],
      destination: `https://${SITE_HOST}/:path`,
      permanent: true,
    };
    const legacyAppPaths = LEGACY_APP_PATHS.map((first) => ({ source: `/${first}/:rest*`, destination: `/app-demo/${first}/:rest*`, permanent: false }));
    return [...(APEX_HOST !== SITE_HOST ? [apexToWww] : []), ...(APP_DEMO_ORIGIN ? legacyAppPaths : [])];
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
