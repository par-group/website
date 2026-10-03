import "server-only";
import type { Client, InArgs } from "@libsql/client";
import { DAY, recentWeeks, weekIndex, type Week } from "@/lib/weeks";
import { appDb } from "@/server/app-db";
import { all } from "@/server/db";

// The weekly numbers on /dashboard. Every metric is by week, Monday to Sunday on
// Toronto time. User metrics follow the week people signed up (a cohort); the
// conversation metrics follow the week the comment was sent or the chat started.
// Only real students count: the app's sample profiles and demo account
// (users.is_sandbox) are left out everywhere.

export const WEEKS_SHOWN = 8;

/** `count` out of `total`. */
export type Rate = { count: number; total: number };
/** The median time, over `n` people. */
export type Duration = { ms: number; n: number };
/** null: nothing to measure that week, or too early to tell. */
export type Cell<T> = T | null;

export type AppMetrics = {
  newAccounts: number[];
  onboarding: Cell<Rate>[];
  timeToFirstConnection: Cell<Duration>[];
  connectedWithin7Days: Cell<Rate>[];
  retention: { d1: Cell<Rate>[]; d7: Cell<Rate>[]; d30: Cell<Rate>[] };
  replyRate: Cell<Rate>[];
  longChats: Cell<Rate>[];
};

export type Dashboard = {
  weeks: Week[];
  generatedAt: number;
  waitlist: {
    total: number;
    signups: number[];
    fromInvites: number[];
    /** Waitlist emails that have an app account, all time and by waitlist week. Needs the app's database. */
    withAccount: number | null;
    toAccount: Cell<Rate>[] | null;
  };
  /** `accounts`: real students with an account, all time. */
  app: { ok: true; via: string; accounts: number; metrics: AppMetrics } | { ok: false; reason: string };
};

/** A chat counts as a real conversation from this many messages. */
export const LONG_CHAT_MESSAGES = 10;

const rate = (count: number, total: number): Cell<Rate> => (total > 0 ? { count, total } : null);

function median(values: number[]): number {
  const sorted = [...values].sort((a, b) => a - b);
  const mid = sorted.length >> 1;
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

function byWeek<T>(weeks: Week[], rows: T[], at: (row: T) => number): T[][] {
  const buckets = weeks.map((): T[] => []);
  for (const row of rows) {
    const i = weekIndex(weeks, at(row));
    if (i >= 0) buckets[i].push(row);
  }
  return buckets;
}

/** SQL numbering a timestamp column by the week it falls in (NULL outside them), and its arguments. */
function weekOf(column: string, weeks: Week[]) {
  return {
    sql: `CASE ${weeks.map((_, i) => `WHEN ${column} >= ? AND ${column} < ? THEN ${i}`).join(" ")} END`,
    args: weeks.flatMap((w) => [w.start, w.end]),
  };
}

async function query<T>(client: Client, sql: string, args: InArgs = []): Promise<T[]> {
  const { rows } = await client.execute({ sql, args });
  return rows.map((r) => ({ ...r }) as T);
}

/** A `GROUP BY week` row: how many of the week's `total` count. */
type WeekRow = { week: number | null; count: number | null; total: number };

function weeklyRates(weeks: Week[], rows: WeekRow[]): Cell<Rate>[] {
  const cells: Cell<Rate>[] = weeks.map(() => null);
  for (const row of rows) if (row.week !== null) cells[row.week] = rate(Number(row.count ?? 0), Number(row.total));
  return cells;
}

async function appMetrics(client: Client, weeks: Week[], now: number): Promise<AppMetrics> {
  const since = weeks[0].start;
  const signupWeek = weekOf("created_at", weeks);

  const signups = await query<WeekRow>(
    client,
    `SELECT ${signupWeek.sql} AS week, COUNT(*) AS total, SUM(profile_complete) AS count
     FROM users WHERE is_sandbox = 0 AND created_at >= ? GROUP BY week`,
    [...signupWeek.args, since],
  );
  const onboarding = weeklyRates(weeks, signups);

  // First match for everyone who finished their profile (only they appear in decks).
  const completed = await query<{ created_at: number; first_match_at: number | null }>(
    client,
    `SELECT u.created_at, f.at AS first_match_at
     FROM users u
     LEFT JOIN (
       SELECT user_id, MIN(created_at) AS at FROM (
         SELECT user_a_id AS user_id, created_at FROM matches
         UNION ALL SELECT user_b_id, created_at FROM matches
       ) GROUP BY user_id
     ) f ON f.user_id = u.id
     WHERE u.is_sandbox = 0 AND u.profile_complete = 1 AND u.created_at >= ?`,
    [since],
  );
  const timeToFirstConnection: Cell<Duration>[] = [];
  const connectedWithin7Days: Cell<Rate>[] = [];
  for (const cohort of byWeek(weeks, completed, (u) => u.created_at)) {
    const waits = cohort.filter((u) => u.first_match_at !== null).map((u) => u.first_match_at! - u.created_at);
    timeToFirstConnection.push(waits.length ? { ms: median(waits), n: waits.length } : null);
    const weekOld = cohort.filter((u) => u.created_at + 7 * DAY <= now);
    connectedWithin7Days.push(rate(weekOld.filter((u) => u.first_match_at !== null && u.first_match_at - u.created_at <= 7 * DAY).length, weekOld.length));
  }

  // Active on day N after signing up (24-hour windows from the signup time):
  // swiped, commented, replied to a comment or sent a message. Opening the app
  // without doing any of those isn't recorded by the app, so it doesn't count.
  const day = (n: number) => `MAX(a.at >= u.created_at + ${n * DAY} AND a.at < u.created_at + ${(n + 1) * DAY})`;
  const users = await query<{ created_at: number; d1: number | null; d7: number | null; d30: number | null }>(
    client,
    `SELECT u.created_at, ${day(1)} AS d1, ${day(7)} AS d7, ${day(30)} AS d30
     FROM users u
     LEFT JOIN (
       SELECT swiper_id AS user_id, created_at AS at FROM swipes WHERE created_at >= ?
       UNION ALL SELECT author_id, created_at FROM comments WHERE created_at >= ?
       UNION ALL SELECT target_user_id, replied_at FROM comments WHERE replied_at >= ?
       UNION ALL SELECT sender_id, created_at FROM messages WHERE created_at >= ?
     ) a ON a.user_id = u.id AND a.at >= u.created_at + ${DAY}
     WHERE u.is_sandbox = 0 AND u.created_at >= ?
     GROUP BY u.id`,
    [since, since, since, since, since],
  );
  const cohorts = byWeek(weeks, users, (u) => u.created_at);
  const retained = (n: 1 | 7 | 30) =>
    cohorts.map((cohort) => {
      // Only people who've had the whole of day N so far.
      const old = cohort.filter((u) => u.created_at + (n + 1) * DAY <= now);
      return rate(old.filter((u) => u[`d${n}`] === 1).length, old.length);
    });

  const commentWeek = weekOf("c.created_at", weeks);
  const replyRate = weeklyRates(
    weeks,
    await query<WeekRow>(
      client,
      `SELECT ${commentWeek.sql} AS week, COUNT(*) AS total, SUM(c.replied_at IS NOT NULL) AS count
       FROM comments c JOIN users a ON a.id = c.author_id JOIN users t ON t.id = c.target_user_id
       WHERE a.is_sandbox = 0 AND t.is_sandbox = 0 AND c.created_at >= ? GROUP BY week`,
      [...commentWeek.args, since],
    ),
  );

  const matchWeek = weekOf("m.created_at", weeks);
  const longChats = weeklyRates(
    weeks,
    await query<WeekRow>(
      client,
      `SELECT ${matchWeek.sql} AS week, COUNT(*) AS total,
         SUM((SELECT COUNT(*) FROM messages x WHERE x.match_id = m.id) >= ${LONG_CHAT_MESSAGES}) AS count
       FROM matches m JOIN users a ON a.id = m.user_a_id JOIN users b ON b.id = m.user_b_id
       WHERE a.is_sandbox = 0 AND b.is_sandbox = 0 AND m.created_at >= ? GROUP BY week`,
      [...matchWeek.args, since],
    ),
  );

  return {
    newAccounts: onboarding.map((cell) => cell?.total ?? 0),
    onboarding,
    timeToFirstConnection,
    connectedWithin7Days,
    retention: { d1: retained(1), d7: retained(7), d30: retained(30) },
    replyRate,
    longChats,
  };
}

export async function loadDashboard(now = Date.now()): Promise<Dashboard> {
  const weeks = recentWeeks(now, WEEKS_SHOWN);
  const signups = await all<{ email: string; source: string | null; created_at: number }>("SELECT email, source, created_at FROM waitlist_signups");
  const signupsByWeek = byWeek(weeks, signups, (s) => s.created_at);

  let app: Dashboard["app"];
  let appEmails: Set<string> | null = null;
  try {
    const database = await appDb();
    if (!database) {
      app = { ok: false, reason: "not connected" };
    } else {
      const emails = await query<{ email: string }>(database.client, "SELECT lower(trim(email)) AS email FROM users WHERE is_sandbox = 0");
      app = { ok: true, via: database.via, accounts: emails.length, metrics: await appMetrics(database.client, weeks, now) };
      appEmails = new Set(emails.map((e) => e.email));
    }
  } catch (e) {
    app = { ok: false, reason: e instanceof Error ? e.message : String(e) };
  }
  const accounts = appEmails;

  return {
    weeks,
    generatedAt: now,
    waitlist: {
      total: signups.length,
      signups: signupsByWeek.map((week) => week.length),
      fromInvites: signupsByWeek.map((week) => week.filter((s) => s.source === "invite").length),
      withAccount: accounts && signups.filter((s) => accounts.has(s.email)).length,
      toAccount: accounts && signupsByWeek.map((week) => rate(week.filter((s) => accounts.has(s.email)).length, week.length)),
    },
    app,
  };
}
