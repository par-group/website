import type { Metadata } from "next";
import Link from "next/link";
import { DailyChart } from "@/components/dashboard/DailyChart";
import { count, type Change } from "@/components/dashboard/format";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { ShareBars } from "@/components/dashboard/ShareBars";
import { Pagination, SignupTable } from "@/components/dashboard/SignupTable";
import { Kpi } from "@/components/dashboard/StatTile";
import {
  isFiltered,
  PAGE_SIZE,
  parseSignupFilters,
  PHONE_FILTERS,
  SCHOOL_FILTERS,
  signupFiltersQuery,
  type SignupFilters,
} from "@/lib/signup-filters";
import { appAccountEmails, appDb } from "@/server/app-db";
import { requireDashboardAccess } from "@/server/dashboard-auth";
import { emailProvider } from "@/server/mailer";
import { findSignups, waitlistSummary } from "@/server/waitlist-insights";

export const metadata: Metadata = { title: "Waitlist" };

const RANGES = [30, 90] as const;
const percent = (part: number, whole: number) => (whole ? `${Math.round((part / whole) * 100)}%` : "–");

function weekChange(last7: number, previous7: number): Change {
  const diff = last7 - previous7;
  if (diff === 0) return { text: "Same as the 7 days before", good: null };
  return { text: `${diff > 0 ? "▲" : "▼"} ${count(Math.abs(diff))} vs the 7 days before`, good: diff > 0 };
}

export default async function WaitlistPage({ searchParams }: PageProps<"/dashboard/waitlist">) {
  await requireDashboardAccess();
  const params = await searchParams;
  const filters = parseSignupFilters(params);
  const days = params.days === "90" ? 90 : 30;
  const [summary, list, accounts] = await Promise.all([
    waitlistSummary(days),
    findSignups(filters),
    // Whether each person has an app account, once the app has data. The list works without it.
    appDb()
      .then(appAccountEmails)
      .catch(() => null),
  ]);

  /** This page with other filters, keeping the chart's range. */
  const href = (next: Partial<SignupFilters>, range: number = days) => {
    const query = signupFiltersQuery(next);
    return `/dashboard/waitlist${query}${range === 90 ? `${query ? "&" : "?"}days=90` : ""}`;
  };
  const listed = { ...filters, page: 1 };
  const inRange = summary.daily.reduce((sum, d) => sum + d.count, 0);
  const busiest = summary.daily.reduce((best, d) => (d.count > best.count ? d : best), summary.daily[0]);
  const from = (list.page - 1) * PAGE_SIZE;

  return (
    <>
      <PageHeader
        title="Waitlist"
        actions={
          <a href="/dashboard/waitlist/download" className="btn-secondary">
            Download all (CSV)
          </a>
        }
      >
        Everyone who joined, how fast it’s growing, and where they came from. Times are Toronto time.
      </PageHeader>

      <section aria-label="Totals" className="mt-8 grid grid-cols-2 gap-3 sm:gap-5 xl:grid-cols-4">
        <Kpi label="Signups" value={count(summary.total)} caption="All time" />
        <Kpi label="Last 7 days" value={count(summary.last7)} change={weekChange(summary.last7, summary.previous7)} />
        <Kpi
          label="Emailed"
          value={count(summary.emailed)}
          caption={
            emailProvider() ? (
              `of ${count(summary.total)} signups got their confirmation`
            ) : (
              <>
                Confirmations aren’t being sent yet.{" "}
                <Link href="/dashboard/setup" className="font-semibold text-green hover:underline">
                  Set up email
                </Link>
              </>
            )
          }
        />
        <Kpi
          label="On iPhone"
          value={percent(summary.iphone, summary.answeredPhone)}
          caption={`${count(summary.iphone)} of ${count(summary.answeredPhone)} who said which phone`}
        />
      </section>

      <section aria-labelledby="per-day" className="card mt-5 p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 id="per-day" className="font-semibold">
              Signups per day
            </h2>
            <p className="mt-1 text-sm text-ink-soft">
              {count(inRange)} in the last {days} days{busiest.count > 0 && `, most on ${busiest.day.label} (${count(busiest.count)})`}. Today, in a
              lighter colour, is still filling in.
            </p>
          </div>
          <div role="group" aria-label="Range" className="flex rounded-full bg-bg p-1 text-sm font-semibold">
            {RANGES.map((range) => (
              <Link
                key={range}
                href={href(filters, range)}
                scroll={false}
                aria-current={range === days ? "true" : undefined}
                className={`rounded-full px-3 py-1 ${range === days ? "bg-surface text-ink shadow-card" : "text-ink-soft hover:text-ink"}`}
              >
                {range} days
              </Link>
            ))}
          </div>
        </div>
        <div className="mt-6">
          <DailyChart days={summary.daily} label={`Signups per day, last ${days} days`} />
        </div>
        <details className="mt-4 text-sm">
          <summary className="cursor-pointer font-semibold text-ink-soft hover:text-ink">Show as a table</summary>
          <table className="mt-3 w-full max-w-sm text-left tabular-nums">
            <thead>
              <tr className="border-b border-line text-ink-soft">
                <th scope="col" className="py-1.5 font-semibold">
                  Day
                </th>
                <th scope="col" className="py-1.5 text-right font-semibold">
                  Signups
                </th>
              </tr>
            </thead>
            <tbody>
              {[...summary.daily].reverse().map(({ day, count: n }) => (
                <tr key={day.start} className="border-t border-line/60">
                  <td className="py-1.5">
                    {day.label}
                    {!day.complete && <span className="text-ink-soft"> (today so far)</span>}
                  </td>
                  <td className="py-1.5 text-right">{count(n)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </details>
      </section>

      <div className="mt-5 grid gap-5 lg:grid-cols-3">
        <section aria-labelledby="sources" className="card p-6">
          <h2 id="sources" className="font-semibold">
            Where they came from
          </h2>
          <p className="mt-1 mb-5 text-sm text-ink-soft">The ?ref= of the link they used, their utm_* tags, or the site that sent them.</p>
          <ShareBars shares={summary.sources} total={summary.total} />
        </section>
        <section aria-labelledby="schools" className="card p-6">
          <h2 id="schools" className="font-semibold">
            Where they study
          </h2>
          <p className="mt-1 mb-5 text-sm text-ink-soft">York email addresses count as York. The rest is what people told us.</p>
          <ShareBars shares={summary.schools} total={summary.total} />
        </section>
        <section aria-labelledby="phones" className="card p-6">
          <h2 id="phones" className="font-semibold">
            Their phone
          </h2>
          <p className="mt-1 mb-5 text-sm text-ink-soft">From the optional question after signing up.</p>
          <ShareBars shares={summary.phones} total={summary.total} />
        </section>
      </div>

      <section aria-labelledby="people" className="mt-12">
        <h2 id="people" className="scroll-mt-24 font-serif text-2xl font-semibold">
          Everyone on the waitlist
        </h2>
        <form method="get" action="/dashboard/waitlist#people" className="mt-4 flex flex-wrap items-end gap-3">
          <label className="flex min-w-56 flex-1 flex-col">
            <span className="label">Search</span>
            <input type="search" name="q" defaultValue={filters.q} placeholder="Email, school or source" className="field" />
          </label>
          <Select
            label="Source"
            name="source"
            value={filters.source}
            options={summary.sourceOptions.map((o) => [o.value, `${o.label} (${count(o.count)})`])}
          />
          <Select label="School" name="school" value={filters.school} options={Object.entries(SCHOOL_FILTERS)} />
          <Select label="Phone" name="platform" value={filters.platform} options={Object.entries(PHONE_FILTERS)} />
          {days === 90 && <input type="hidden" name="days" value="90" />}
          <button type="submit" className="btn-primary">
            Apply
          </button>
          {isFiltered(filters) && (
            <Link href={href({})} className="btn-ghost">
              Clear
            </Link>
          )}
        </form>

        <div className="card mt-4 overflow-hidden">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-5 py-3 text-sm">
            <p className="text-ink-soft" aria-live="polite">
              {list.total ? (
                <>
                  Showing <strong className="text-ink">{count(from + 1)}</strong>–
                  <strong className="text-ink">{count(from + list.rows.length)}</strong> of <strong className="text-ink">{count(list.total)}</strong>{" "}
                  {isFiltered(filters) ? `matching (${count(summary.total)} in total)` : "signups"}, newest first
                </>
              ) : (
                "No signups to show"
              )}
            </p>
            {list.total > 0 && isFiltered(filters) && (
              <a href={`/dashboard/waitlist/download${signupFiltersQuery(listed)}`} className="font-semibold text-green hover:underline">
                Download these {count(list.total)} (CSV)
              </a>
            )}
          </div>
          {list.total ? (
            <>
              <SignupTable rows={list.rows} accounts={accounts} />
              <Pagination page={list.page} pages={list.pages} href={(page) => `${href({ ...filters, page })}#people`} />
            </>
          ) : (
            <p className="px-5 py-10 text-center text-ink-soft">
              {isFiltered(filters) ? (
                <>
                  No signups match these filters.{" "}
                  <Link href={href({})} className="font-semibold text-green hover:underline">
                    Clear them
                  </Link>
                </>
              ) : (
                "No one has joined yet."
              )}
            </p>
          )}
        </div>
      </section>
    </>
  );
}

function Select({ label, name, value, options }: { label: string; name: string; value: string | null; options: [string, string][] }) {
  return (
    <label className="flex flex-col">
      <span className="label">{label}</span>
      <select name={name} defaultValue={value ?? ""} className="field min-w-40 pr-8">
        <option value="">All</option>
        {options.map(([optionValue, optionLabel]) => (
          <option key={optionValue} value={optionValue}>
            {optionLabel}
          </option>
        ))}
      </select>
    </label>
  );
}
