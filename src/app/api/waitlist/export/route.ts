import crypto from "node:crypto";
import { listSignups } from "@/server/waitlist";

/**
 * Downloads the waitlist as a CSV, e.g. to import into the tool that sends the
 * launch email. Open /api/waitlist/export in a browser and enter
 * WAITLIST_EXPORT_PASSWORD when asked (any username). The route doesn't exist
 * unless that variable is set.
 */
export async function GET(request: Request) {
  const password = process.env.WAITLIST_EXPORT_PASSWORD;
  if (!password) return new Response("Not found", { status: 404 });
  if (!isAuthorized(request, password)) {
    return new Response("Password required", {
      status: 401,
      headers: { "WWW-Authenticate": 'Basic realm="Sidekick waitlist", charset="UTF-8"', "Cache-Control": "no-store" },
    });
  }

  const rows = await listSignups();
  const iso = (ms: number) => new Date(ms).toISOString();
  const csv = [
    ["email", "school", "platform", "source", "signed_up_at", "updated_at"],
    ...rows.map((r) => [r.email, r.school, r.platform, r.source, iso(r.created_at), iso(r.updated_at)]),
  ]
    .map((cells) => cells.map(csvCell).join(","))
    .join("\r\n");

  return new Response(`${csv}\r\n`, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="sidekick-waitlist-${iso(Date.now()).slice(0, 10)}.csv"`,
      "Cache-Control": "no-store",
      "X-Robots-Tag": "noindex",
    },
  });
}

/** Basic auth, compared in constant time; the username is ignored. */
function isAuthorized(request: Request, password: string) {
  const [scheme, encoded] = (request.headers.get("authorization") ?? "").split(" ");
  if (scheme !== "Basic" || !encoded) return false;
  const decoded = Buffer.from(encoded, "base64").toString("utf8");
  const given = decoded.slice(decoded.indexOf(":") + 1);
  const digest = (s: string) => crypto.createHash("sha256").update(s).digest();
  return crypto.timingSafeEqual(digest(given), digest(password));
}

/** Quotes every cell, and defuses values a spreadsheet would run as a formula (school and source are typed by visitors). */
function csvCell(value: string | null) {
  const text = value ?? "";
  const safe = /^[=+\-@\t\r]/.test(text) ? `'${text}` : text;
  return `"${safe.replace(/"/g, '""')}"`;
}
