import { hasPassword, passwordRequired } from "@/server/basic-auth";
import { csvResponse } from "@/server/csv";
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
  return csvResponse(
    `sidekick-waitlist-${iso(Date.now()).slice(0, 10)}.csv`,
    ["email", "school", "platform", "source", "signed_up_at", "updated_at"],
    rows.map((r) => [r.email, r.school, r.platform, r.source, iso(r.created_at), iso(r.updated_at)]),
  );
}
