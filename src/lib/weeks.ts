// Weeks for the metrics dashboard: Monday to Sunday, on Toronto time (York's clock).

export const TIME_ZONE = "America/Toronto";
export const DAY = 86_400_000;

export type Week = {
  /** Monday 00:00 Toronto time, epoch ms. */
  start: number;
  /** The next Monday 00:00, epoch ms (exclusive). */
  end: number;
  /** e.g. "Sep 28" */
  label: string;
  /** False for the week that's still going. */
  complete: boolean;
};

const partsFormat = new Intl.DateTimeFormat("en-CA", {
  timeZone: TIME_ZONE,
  hourCycle: "h23",
  year: "numeric",
  month: "numeric",
  day: "numeric",
  hour: "numeric",
  minute: "numeric",
  second: "numeric",
});
const labelFormat = new Intl.DateTimeFormat("en-CA", { timeZone: TIME_ZONE, month: "short", day: "numeric" });

/** Toronto wall-clock time minus UTC, in ms, at the instant `ms`. */
function offsetAt(ms: number): number {
  const p = Object.fromEntries(partsFormat.formatToParts(ms).map(({ type, value }) => [type, Number(value)]));
  return Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute, p.second) - Math.floor(ms / 1000) * 1000;
}

/** Monday 00:00 Toronto time of the week containing `ms`. */
export function weekStart(ms: number): number {
  const local = new Date(ms + offsetAt(ms)); // Toronto wall clock, read with the UTC getters
  const monday = Date.UTC(local.getUTCFullYear(), local.getUTCMonth(), local.getUTCDate()) - ((local.getUTCDay() + 6) % 7) * DAY;
  // Midnight is never inside a daylight-saving change in Toronto (those happen at 2am).
  return monday - offsetAt(monday - offsetAt(monday));
}

/** The last `count` weeks, oldest first, ending with the week containing `now`. */
export function recentWeeks(now: number, count: number): Week[] {
  const weeks: Week[] = [];
  let start = weekStart(now);
  for (let i = 0; i < count; i++) {
    const end = weekStart(start + 8 * DAY);
    weeks.unshift({ start, end, label: labelFormat.format(start), complete: end <= now });
    start = weekStart(start - DAY);
  }
  return weeks;
}

/** The index of the week containing `ms`, or -1 if it's outside them all. */
export function weekIndex(weeks: Week[], ms: number): number {
  return weeks.findIndex((w) => ms >= w.start && ms < w.end);
}
