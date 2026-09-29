// Public-facing site details, used by metadata and the pages. Safe for client and server.

const ORIGIN = process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.trysidekick.ca";

/**
 * The App Store listing's numeric ID (the digits in apps.apple.com/…/id1234567890).
 * TODO(launch): set it once the listing is live. Until then the site shows
 * "Coming soon" badges; afterwards they link to the App Store, and iPhone
 * visitors also get Safari's Smart App Banner.
 */
const APP_STORE_ID = null as string | null;

export const SITE = {
  name: "Sidekick",
  url: ORIGIN,
  /** Short form for body text, e.g. trysidekick.ca */
  displayUrl: new URL(ORIGIN).host.replace(/^www\./, ""),
  tagline: "Find your people at York.",
  description:
    "Sidekick is a friends-only app for university students, launching first at York University. Swipe through students who share your campus, major and interests, and turn a conversation into plans.",
  supportEmail: "hello@trysidekick.ca",
  appStoreId: APP_STORE_ID,
  appStoreUrl: APP_STORE_ID ? `https://apps.apple.com/ca/app/id${APP_STORE_ID}` : null,
  /**
   * The web version of the app (the app-demo project, served at /app-demo on the
   * same domain). Mentioned once, in the FAQ. Set to null to stop linking it.
   * Links to sign-in, not /app-demo itself: once the app's MAIN_SITE_URL is set,
   * /app-demo sends signed-out visitors back to this site's home page.
   */
  webPreviewUrl: `${ORIGIN}/app-demo/login` as string | null,
} as const;

/** Pages anyone can read (also the sitemap). */
export const PUBLIC_PAGES = ["/", "/safety", "/support", "/privacy", "/terms"] as const;

/** Date shown on the Privacy Policy and Terms. Update it whenever either changes. */
export const LEGAL_LAST_UPDATED = "September 29, 2026";
