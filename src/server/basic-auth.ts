import "server-only";
import crypto from "node:crypto";

// HTTP Basic auth for the owner-only pages (the waitlist export and the
// dashboard): the browser asks for a password, and any username is accepted.

export const DASHBOARD_REALM = "Sidekick dashboard";

/** Whether an Authorization header carries `password`, compared in constant time. */
export function hasPassword(authorization: string | null, password: string): boolean {
  const [scheme, encoded] = (authorization ?? "").split(" ");
  if (scheme !== "Basic" || !encoded) return false;
  const decoded = Buffer.from(encoded, "base64").toString("utf8");
  const given = decoded.slice(decoded.indexOf(":") + 1);
  const digest = (s: string) => crypto.createHash("sha256").update(s).digest();
  return crypto.timingSafeEqual(digest(given), digest(password));
}

/** The response that makes the browser ask for the password. */
export function passwordRequired(realm: string): Response {
  return new Response("Password required", {
    status: 401,
    headers: { "WWW-Authenticate": `Basic realm="${realm}", charset="UTF-8"`, "Cache-Control": "no-store" },
  });
}
