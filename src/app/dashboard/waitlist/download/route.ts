import { isFiltered, parseSignupFilters } from "@/lib/signup-filters";
import { csvResponse } from "@/server/csv";
import { dashboardRequestDenied } from "@/server/dashboard-auth";
import { allMatchingSignups } from "@/server/waitlist-insights";

/** The dashboard's waitlist as a CSV: everyone, or just the signups matching the list's filters (same query string). */
export async function GET(request: Request) {
  const denied = dashboardRequestDenied(request);
  if (denied) return denied;

  const filters = parseSignupFilters(Object.fromEntries(new URL(request.url).searchParams));
  const rows = await allMatchingSignups(filters);
  const iso = (ms: number) => new Date(ms).toISOString();
  return csvResponse(
    `sidekick-waitlist${isFiltered(filters) ? "-filtered" : ""}-${iso(Date.now()).slice(0, 10)}.csv`,
    ["email", "school", "platform", "source", "signed_up_at", "updated_at"],
    rows.map((r) => [r.email, r.school, r.platform, r.source, iso(r.created_at), iso(r.updated_at)]),
  );
}
