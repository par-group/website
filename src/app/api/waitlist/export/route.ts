import { hasPassword, passwordRequired } from "@/server/basic-auth";
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
  if (!hasPassword(request.headers.get("authorization"), password)) return passwordRequired("Sidekick waitlist");

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

/** Quotes every cell, and defuses values a spreadsheet would run as a formula (school and source are typed by visitors). */
function csvCell(value: string | null) {
  const text = value ?? "";
  const safe = /^[=+\-@\t\r]/.test(text) ? `'${text}` : text;
  return `"${safe.replace(/"/g, '""')}"`;
}
