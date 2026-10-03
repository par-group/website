import type { Metadata } from "next";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { count, duration, durationChange, latest, percent, rateChange, ratio, share, weekRange } from "@/components/dashboard/format";
import { Sparkline } from "@/components/dashboard/Sparkline";
import { Figure, NoData, StatTile } from "@/components/dashboard/StatTile";
import { WeeklyTable, type TableCell, type TableRow } from "@/components/dashboard/WeeklyTable";
import { SITE } from "@/lib/site";
import { TIME_ZONE, type Week } from "@/lib/weeks";
import { hasPassword } from "@/server/basic-auth";
import { LONG_CHAT_MESSAGES, loadDashboard, type Cell, type Duration, type Rate } from "@/server/metrics";

export const metadata: Metadata = { title: "Dashboard", robots: { index: false } };

const rateCell = (cell: Cell<Rate>): TableCell => cell && { value: percent(cell), detail: share(cell) };
const durationCell = (cell: Cell<Duration>): TableCell => cell && { value: duration(cell.ms), detail: `${count(cell.n)} ${cell.n === 1 ? "person" : "people"}` };
const countCells = (values: number[]): TableCell[] => values.map((n) => ({ value: count(n) }));

/** The trend over finished weeks, for a tile. */
function trend<T>(weeks: Week[], cells: Cell<T>[], label: string, value: (cell: T) => number, text: (cell: T) => string) {
  const points = weeks.flatMap((week, i) => {
    const cell = cells[i];
    return week.complete ? [{ value: cell === null ? null : value(cell), title: `Week of ${week.label}: ${cell === null ? "no data" : text(cell)}` }] : [];
  });
  return <Sparkline points={points} label={label} />;
}

/** A tile's headline share: the newest finished week, the change, and the trend. */
function RateFigure({
  weeks,
  cells,
  of,
  label,
  titled,
  size,
}: {
  weeks: Week[];
  cells: Cell<Rate>[];
  /** What the total counts, e.g. "comments sent". */
  of: string;
  label: string;
  /** Show the label: for tiles with more than one number. */
  titled?: boolean;
  size?: "small";
}) {
  const head = latest(cells, weeks);
  if (!head) return <NoData>{label}: nothing to measure yet.</NoData>;
  return (
    <Figure
      label={titled ? label : undefined}
      size={size}
      value={percent(head.cell)}
      caption={`${share(head.cell)} ${of} ${weekRange(head.week)}`}
      change={rateChange(head.cell, head.previous)}
      trend={size ? undefined : trend(weeks, cells, `${label}, week by week`, ratio, (c) => `${percent(c)} (${share(c)})`)}
    />
  );
}

export default async function DashboardPage() {
  // proxy.ts asks for the password. This checks it again, and hides the page when none is set.
  // Reading the request first keeps the page per-request, so it can't be built as a fixed 404.
  const authorization = (await headers()).get("authorization");
  const password = process.env.DASHBOARD_PASSWORD;
  if (!password || !hasPassword(authorization, password)) notFound();

  const { weeks, waitlist, app, generatedAt } = await loadDashboard();
  const m = app.ok ? app.metrics : null;
  const lastFull = weeks.findLastIndex((w) => w.complete);
  const updated = new Intl.DateTimeFormat("en-CA", { timeZone: TIME_ZONE, dateStyle: "medium", timeStyle: "short" }).format(generatedAt);
  const needsApp = <NoData>Needs the app’s database (see the note at the top).</NoData>;

  const rows: TableRow[] = [
    { group: "Waitlist" },
    { label: "Signups", cells: countCells(waitlist.signups) },
    { label: "From invite links", cells: countCells(waitlist.fromInvites) },
    ...(waitlist.toAccount ? [{ label: "Have an account now", cells: waitlist.toAccount.map(rateCell) }] : []),
    ...(m
      ? [
          { group: "Accounts, by signup week" },
          { label: "New accounts", cells: countCells(m.newAccounts) },
          { label: "Finished onboarding", cells: m.onboarding.map(rateCell) },
          { label: "Time to first friend (median)", cells: m.timeToFirstConnection.map(durationCell) },
          { label: "First friend within 7 days", cells: m.connectedWithin7Days.map(rateCell) },
          { group: "Retention, by signup week" },
          { label: "Day 1", cells: m.retention.d1.map(rateCell) },
          { label: "Day 7", cells: m.retention.d7.map(rateCell) },
          { label: "Day 30", cells: m.retention.d30.map(rateCell) },
          { group: "Conversations" },
          { label: "Comments that got a reply", cells: m.replyRate.map(rateCell) },
          { label: `Chats reaching ${LONG_CHAT_MESSAGES}+ messages`, cells: m.longChats.map(rateCell) },
        ]
      : []),
  ];

  return (
    <div className="site-container py-12 [--spark:#8fa6a3] sm:py-16">
      <p className="eyebrow text-green">Dashboard</p>
      <h1 className="mt-2 font-serif text-4xl font-semibold sm:text-5xl">Weekly metrics</h1>
      <p className="mt-3 max-w-3xl text-ink-soft">
        Tiles show the last full week{lastFull >= 0 && <>, {weekRange(weeks[lastFull])}</>} (Monday to Sunday, Toronto time), compared with the week
        before. Real students only: the app’s sample profiles and demo account are left out.
      </p>
      <p className="mt-1 text-sm text-ink-soft">Updated {updated}</p>

      {!app.ok && (
        <div role="status" className="mt-6 rounded-2xl border border-mustard bg-mustard-soft px-5 py-4 text-sm text-accent-ink">
          {app.reason === "no app data yet" ? (
            <>
              <strong>No app data yet</strong>, so only the waitlist numbers show. The app creates its tables the first time it runs on its database
              (the waitlist’s, from launch), and these tiles fill in by themselves. See docs/deployment.md, “7. Metrics dashboard”.
            </>
          ) : (
            <>
              <strong>Couldn’t read the app’s database:</strong> {app.reason}
            </>
          )}
        </div>
      )}

      <div className="mt-8 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        <StatTile title="Waitlist → install rate" why="Whether your hype converts." tag="Accounts until launch">
          {waitlist.total === 0 ? (
            <NoData>No one is on the waitlist yet.</NoData>
          ) : waitlist.withAccount === null ? (
            <Figure value={count(waitlist.total)} caption="people on the waitlist" />
          ) : (
            <Figure
              value={percent({ count: waitlist.withAccount, total: waitlist.total })}
              caption={`${count(waitlist.withAccount)} of ${count(waitlist.total)} people on the waitlist have an account`}
            />
          )}
          {lastFull >= 0 && (
            <Figure
              size="small"
              value={count(waitlist.signups[lastFull])}
              caption={`joined the waitlist ${weekRange(weeks[lastFull])}`}
              trend={trend(weeks, waitlist.signups, "Waitlist signups, week by week", (n) => n, (n) => `${count(n)} signups`)}
            />
          )}
          <p className="text-xs text-ink-soft">Counts accounts, since there’s no app to install yet. After launch, installs are in App Store Connect.</p>
        </StatTile>

        <StatTile title="Onboarding completion" why="Whether signup is too long.">
          {m ? <RateFigure weeks={weeks} cells={m.onboarding} of="people who signed up" label="Onboarding completion" /> : needsApp}
        </StatTile>

        <StatTile title="Time to first connection" why="Whether density is there.">
          {m ? (
            <>
              <DurationFigure weeks={weeks} cells={m.timeToFirstConnection} />
              <RateFigure weeks={weeks} cells={m.connectedWithin7Days} of="who signed up" label="First friend within 7 days" titled size="small" />
            </>
          ) : (
            needsApp
          )}
        </StatTile>

        <StatTile title="D1 / D7 / D30 retention" why="Whether people come back.">
          {m ? (
            <div className="grid gap-5">
              {(["d1", "d7", "d30"] as const).map((key) => (
                <RateFigure key={key} weeks={weeks} cells={m.retention[key]} of="who signed up" label={`Day ${key.slice(1)}`} titled size="small" />
              ))}
            </div>
          ) : (
            needsApp
          )}
          <p className="text-xs text-ink-soft">Back means they swiped, commented, replied or messaged that day. Just opening the app isn’t recorded.</p>
        </StatTile>

        <StatTile title="Invites" why="Whether the viral loop works." tag="Not tracked yet">
          <NoData>
            The app doesn’t send invites yet. Once it records each invite and who joined from it, this shows invites sent per user and how many invitees
            become active.
          </NoData>
          {lastFull >= 0 && (
            <Figure size="small" value={count(waitlist.fromInvites[lastFull])} caption={`joined the waitlist from an invite link ${weekRange(weeks[lastFull])}`} />
          )}
        </StatTile>

        <StatTile title="Conversation quality" why="Whether people actually talk.">
          {m ? (
            <>
              <RateFigure weeks={weeks} cells={m.replyRate} of="comments sent" label="Reply rate" titled />
              <RateFigure weeks={weeks} cells={m.longChats} of="chats started" label={`Chats reaching ${LONG_CHAT_MESSAGES}+ messages`} titled />
            </>
          ) : (
            needsApp
          )}
        </StatTile>

        <StatTile title="Reports per 1,000 users" why="Safety health." tag="Not tracked yet">
          <NoData>
            Reports come in by email to {SITE.supportEmail}, so the app can’t count them. Until it has in-app reporting, count the week’s reports by hand
            and divide by {app.ok ? <strong className="text-ink">{count(app.accounts)} accounts</strong> : "the number of accounts"}, times 1,000.
          </NoData>
        </StatTile>
      </div>

      <h2 className="mt-14 font-serif text-2xl font-semibold">Week by week</h2>
      <p className="mt-2 max-w-3xl text-sm text-ink-soft">
        The current week is still filling in. Recent weeks can still go up: people who signed up recently haven’t had 7 or 30 days yet, and new
        comments and chats have had less time to get going.
      </p>
      <div className="mt-5">
        <WeeklyTable weeks={weeks} rows={rows} />
      </div>

      <details className="mt-10 max-w-3xl text-sm text-ink-soft">
        <summary className="cursor-pointer font-semibold text-ink">How each number is counted</summary>
        <dl className="mt-4 grid gap-3 [&_dt]:font-semibold [&_dt]:text-ink">
          <dt>Waitlist → account</dt>
          <dd>Waitlist emails that match an app account. York students sign up with their York email, so someone who joined the waitlist with Gmail won’t match.</dd>
          <dt>Onboarding completion</dt>
          <dd>Of the accounts created that week, how many have a finished profile today.</dd>
          <dt>Time to first connection</dt>
          <dd>For people who finished their profile, the median time from signing up to their first friend (a match). “Within 7 days” only counts people who signed up at least 7 days ago.</dd>
          <dt>Retention</dt>
          <dd>Day N is the 24 hours starting N days after signing up. Only people who’ve had all of day N so far are counted.</dd>
          <dt>Reply rate</dt>
          <dd>Comments on a photo, prompt or tag, sent that week, that the other person replied to (which makes them friends).</dd>
          <dt>Chats reaching {LONG_CHAT_MESSAGES}+ messages</dt>
          <dd>Chats started that week with at least {LONG_CHAT_MESSAGES} messages so far, from either person.</dd>
        </dl>
      </details>
    </div>
  );
}

function DurationFigure({ weeks, cells }: { weeks: Week[]; cells: Cell<Duration>[] }) {
  const head = latest(cells, weeks);
  if (!head) return <NoData>No one has made a friend yet.</NoData>;
  return (
    <Figure
      value={duration(head.cell.ms)}
      caption={`median from signup to first friend, for ${count(head.cell.n)} who signed up ${weekRange(head.week)}`}
      change={durationChange(head.cell, head.previous)}
      trend={trend(weeks, cells, "Time to first friend, week by week", (c) => c.ms, (c) => `${duration(c.ms)} (${count(c.n)} people)`)}
    />
  );
}
