// Waitlist input rules, shared by the form (client) and the Server Actions,
// which re-check everything. No database or secrets here.

export const YORK = "York University";
export const SCHOOL_MAX = 80;
export const EMAIL_MAX = 254;
export const SOURCE_MAX = 120;

export const PLATFORMS = { ios: "iPhone", android: "Android" } as const;
export type Platform = keyof typeof PLATFORMS;

/** York addresses (students and staff) imply the school, so the follow-up question can be pre-filled. */
const YORK_DOMAINS = ["my.yorku.ca", "yorku.ca"];

/** Lower-cased and trimmed, so "Name@My.YorkU.ca " and "name@my.yorku.ca" are one signup. */
export function normalizeEmail(input: string): string {
  return input.trim().toLowerCase();
}

export function isValidEmail(email: string): boolean {
  return email.length <= EMAIL_MAX && /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email);
}

export function schoolForEmail(email: string): string | null {
  const domain = email.slice(email.lastIndexOf("@") + 1);
  return YORK_DOMAINS.includes(domain) ? YORK : null;
}

/** Collapses whitespace and caps the length; empty means "not answered". */
export function cleanSchool(input: unknown): string | null {
  if (typeof input !== "string") return null;
  const school = input.replace(/\s+/g, " ").trim().slice(0, SCHOOL_MAX);
  return school || null;
}

export function cleanPlatform(input: unknown): Platform | null {
  return input === "ios" || input === "android" ? input : null;
}

/**
 * Where a signup came from, for counting which posters, links and posts work:
 * `?ref=poster-vari-hall`, or the utm_* parameters, or the referring site.
 * Only a short, plain-text label is kept.
 */
export function cleanSource(input: unknown): string | null {
  if (typeof input !== "string") return null;
  const source = input
    .replace(/[^\w\-./: ]/g, "")
    .trim()
    .slice(0, SOURCE_MAX);
  return source || null;
}

/** Builds the source label from a page URL's query string and document.referrer (browser only). */
export function sourceFromLocation(search: string, referrer: string, ownHost: string): string | null {
  const params = new URLSearchParams(search);
  const ref = params.get("ref");
  if (ref) return cleanSource(ref);
  const utm = ["utm_source", "utm_medium", "utm_campaign"].map((key) => params.get(key)).filter(Boolean);
  if (utm.length) return cleanSource(utm.join("/"));
  try {
    const host = new URL(referrer).host.replace(/^www\./, "");
    return host && host !== ownHost.replace(/^www\./, "") ? cleanSource(host) : null;
  } catch {
    return null;
  }
}
