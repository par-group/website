import "server-only";
import { DAY, periodIndex, recentDays, type Period } from "@/lib/calendar";
import { NO_SOURCE, PAGE_SIZE, PHONE_FILTERS, type SignupFilters } from "@/lib/signup-filters";
import { YORK } from "@/lib/waitlist";
import { all } from "@/server/db";
import type { WaitlistSignup } from "@/server/waitlist";

// What the dashboard's Waitlist page reads: the signups themselves (searched,
// filtered and paged in SQL), and the totals and breakdowns above them.

const COLUMNS = "id, email, school, platform, source, confirmation_sent_at, created_at, updated_at";

/** A LIKE pattern matching `text` literally, anywhere (with ESCAPE '\'). */
const containing = (text: string) => `%${text.replace(/[\\%_]/g, (c) => `\\${c}`)}%`;

function whereClause(filters: SignupFilters): { sql: string; args: string[] } {
  const clauses: string[] = [];
  const args: string[] = [];
  const add = (clause: string, ...values: string[]) => {
    clauses.push(clause);
    args.push(...values);
  };

  if (filters.q) {
    const pattern = containing(filters.q);
    add(`(email LIKE ? ESCAPE '\\' OR school LIKE ? ESCAPE '\\' OR source LIKE ? ESCAPE '\\')`, pattern, pattern, pattern);
  }

  if (filters.source === NO_SOURCE) add("source IS NULL");
  else if (filters.source) add("source = ?", filters.source);

  if (filters.school === "york") add("school = ?", YORK);
  else if (filters.school === "other") add("school IS NOT NULL AND school != ?", YORK);
  else if (filters.school === "none") add("school IS NULL");

  if (filters.platform === "none") add("platform IS NULL");
  else if (filters.platform) add("platform = ?", filters.platform);

  return { sql: clauses.length ? `WHERE ${clauses.join(" AND ")}` : "", args };
}

export type SignupPage = { rows: WaitlistSignup[]; total: number; page: number; pages: number };

/** One page of the signups matching `filters`, newest first. A page past the end shows the last one. */
export async function findSignups(filters: SignupFilters): Promise<SignupPage> {
  const where = whereClause(filters);
  const [{ total }] = await all<{ total: number }>(`SELECT COUNT(*) AS total FROM waitlist_signups ${where.sql}`, where.args);
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const page = Math.min(filters.page, pages);
  const rows = await all<WaitlistSignup>(`SELECT ${COLUMNS} FROM waitlist_signups ${where.sql} ORDER BY created_at DESC, id LIMIT ? OFFSET ?`, [
    ...where.args,
    PAGE_SIZE,
    (page - 1) * PAGE_SIZE,
  ]);
  return { rows, total, page, pages };
}

/** Every signup matching `filters`, newest first: the dashboard's download. */
export function allMatchingSignups(filters: SignupFilters): Promise<WaitlistSignup[]> {
  const where = whereClause(filters);
  return all<WaitlistSignup>(`SELECT ${COLUMNS} FROM waitlist_signups ${where.sql} ORDER BY created_at DESC, id`, where.args);
}

/** One bar of a breakdown, with the filters that list exactly those signups (none for "everything else"). */
export type Share = { label: string; count: number; filters: Partial<SignupFilters> | null };

export type WaitlistSummary = {
  total: number;
  /** Signups in the 7 days up to now, and the 7 before that. */
  last7: number;
  previous7: number;
  /** Signups whose confirmation email was accepted for delivery. */
  emailed: number;
  /** Signups that answered the phone question, and how many of them said iPhone. */
  answeredPhone: number;
  iphone: number;
  daily: { day: Period; count: number }[];
  sources: Share[];
  schools: Share[];
  phones: Share[];
  /** Every source, most signups first: the list's source filter. */
  sourceOptions: { value: string; label: string; count: number }[];
};

const sourceLabel = (source: string | null) => source ?? "No source (came directly)";

/** The largest `limit` groups, then the rest summed as "Everything else". */
function largest(groups: { key: string | null; count: number }[], limit: number, describe: (key: string | null) => Omit<Share, "count">): Share[] {
  const shares = groups.slice(0, limit).map((g) => ({ ...describe(g.key), count: Number(g.count) }));
  const rest = groups.slice(limit).reduce((sum, g) => sum + Number(g.count), 0);
  return rest ? [...shares, { label: "Everything else", count: rest, filters: null }] : shares;
}

export async function waitlistSummary(days: number, now = Date.now()): Promise<WaitlistSummary> {
  const [totals] = await all<{
    total: number;
    last7: number | null;
    previous7: number | null;
    emailed: number | null;
    answered: number | null;
    iphone: number | null;
  }>(
    `SELECT COUNT(*) AS total,
       SUM(created_at > ?) AS last7,
       SUM(created_at > ? AND created_at <= ?) AS previous7,
       SUM(confirmation_sent_at IS NOT NULL) AS emailed,
       SUM(platform IS NOT NULL) AS answered,
       SUM(platform = 'ios') AS iphone
     FROM waitlist_signups`,
    [now - 7 * DAY, now - 14 * DAY, now - 7 * DAY],
  );

  const window = recentDays(now, days);
  const daily = window.map((day) => ({ day, count: 0 }));
  for (const { created_at } of await all<{ created_at: number }>("SELECT created_at FROM waitlist_signups WHERE created_at >= ?", [
    window[0].start,
  ])) {
    const i = periodIndex(window, created_at);
    if (i >= 0) daily[i].count++;
  }

  const grouped = (column: "source" | "school" | "platform") =>
    all<{ key: string | null; count: number }>(
      `SELECT ${column} AS key, COUNT(*) AS count FROM waitlist_signups GROUP BY ${column} ORDER BY count DESC, ${column} IS NULL, ${column}`,
    );
  const [sources, schools, phones] = await Promise.all([grouped("source"), grouped("school"), grouped("platform")]);

  return {
    total: Number(totals.total),
    last7: Number(totals.last7 ?? 0),
    previous7: Number(totals.previous7 ?? 0),
    emailed: Number(totals.emailed ?? 0),
    answeredPhone: Number(totals.answered ?? 0),
    iphone: Number(totals.iphone ?? 0),
    daily,
    sources: largest(sources, 7, (key) => ({ label: sourceLabel(key), filters: { source: key ?? NO_SOURCE } })),
    schools: largest(schools, 7, (key) =>
      key === null
        ? { label: "Not answered", filters: { school: "none" } }
        : key === YORK
          ? { label: key, filters: { school: "york" } }
          : { label: key, filters: { q: key } },
    ),
    phones: (["ios", "android", null] as const).map((key) => ({
      label: PHONE_FILTERS[key ?? "none"],
      count: Number(phones.find((p) => p.key === key)?.count ?? 0),
      filters: { platform: key ?? "none" },
    })),
    sourceOptions: sources.map(({ key, count }) => ({ value: key ?? NO_SOURCE, label: sourceLabel(key), count: Number(count) })),
  };
}
