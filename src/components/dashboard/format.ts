import { DAY, TIME_ZONE, type Week } from "@/lib/weeks";
import type { Cell, Duration, Rate } from "@/server/metrics";

const number = new Intl.NumberFormat("en-CA");
const day = new Intl.DateTimeFormat("en-CA", { timeZone: TIME_ZONE, month: "short", day: "numeric" });

export const count = (n: number) => number.format(n);
export const ratio = (r: Rate) => r.count / r.total;
export const percent = (r: Rate) => `${Math.round(ratio(r) * 100)}%`;
export const share = (r: Rate) => `${count(r.count)} of ${count(r.total)}`;

/** "45 min", "18 h", "3.5 days" */
export function duration(ms: number): string {
  const hours = ms / 3_600_000;
  if (hours < 1) return `${Math.max(1, Math.round(ms / 60_000))} min`;
  if (hours < 48) return `${Math.round(hours)} h`;
  return `${(hours / 24).toFixed(1).replace(/\.0$/, "")} days`;
}

/** "Sep 28 – Oct 4" */
export const weekRange = (week: Week) => `${week.label} – ${day.format(week.end - DAY)}`;

/** The newest finished week that has a value, and the week before it: what a stat tile leads with. */
export function latest<T>(cells: Cell<T>[], weeks: Week[]): { week: Week; cell: T; previous: Cell<T> } | null {
  for (let i = cells.length - 1; i >= 0; i--) {
    const cell = cells[i];
    if (weeks[i].complete && cell !== null) return { week: weeks[i], cell, previous: i > 0 ? cells[i - 1] : null };
  }
  return null;
}

export type Change = { text: string; good: boolean | null };

/** The change from the week before, in percentage points. */
export function rateChange(current: Rate, previous: Cell<Rate>): Change | null {
  if (!previous) return null;
  const points = Math.round((ratio(current) - ratio(previous)) * 100);
  if (points === 0) return { text: "Same as the week before", good: null };
  return { text: `${points > 0 ? "▲" : "▼"} ${Math.abs(points)} pts vs the week before`, good: points > 0 };
}

/** The change from the week before, for a wait (shorter is better). */
export function durationChange(current: Duration, previous: Cell<Duration>): Change | null {
  if (!previous) return null;
  const diff = current.ms - previous.ms;
  if (Math.abs(diff) < 3_600_000) return { text: "About the same as the week before", good: null };
  return { text: `${diff > 0 ? "▲" : "▼"} ${duration(Math.abs(diff))} vs the week before`, good: diff < 0 };
}
