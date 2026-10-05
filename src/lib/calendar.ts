// Days and weeks for the dashboard, on Toronto time (York's clock). Weeks run Monday to Sunday.

export const TIME_ZONE = "America/Toronto";
export const DAY = 86_400_000;

/** A span of time: a day or a week. */
export type Period = {
  /** Midnight Toronto time at the start, epoch ms. */
  start: number;
  /** Midnight at the start of the next period, epoch ms (exclusive). */
  end: number;
  /** e.g. "Sep 28" */
  label: string;
  /** False for the period that's still going. */
  complete: boolean;
};
export type Week = Period;

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

/** The instant of midnight in Toronto on a date, given as Date.UTC(year, month, day). */
function torontoMidnight(date: number): number {
  // Midnight is never inside a daylight-saving change in Toronto (those happen at 2am).
  return date - offsetAt(date - offsetAt(date));
}

/** The Toronto calendar date containing `ms`, as Date.UTC(year, month, day), and its weekday (0 is Sunday). */
function torontoDate(ms: number): { date: number; weekday: number } {
  const local = new Date(ms + offsetAt(ms)); // Toronto wall clock, read with the UTC getters
  return { date: Date.UTC(local.getUTCFullYear(), local.getUTCMonth(), local.getUTCDate()), weekday: local.getUTCDay() };
}

/** Midnight Toronto time of the day containing `ms`. */
export function dayStart(ms: number): number {
  return torontoMidnight(torontoDate(ms).date);
}

/** Monday 00:00 Toronto time of the week containing `ms`. */
export function weekStart(ms: number): number {
  const { date, weekday } = torontoDate(ms);
  return torontoMidnight(date - ((weekday + 6) % 7) * DAY);
}

/** The last `count` periods, oldest first, ending with the one containing `now`. */
function recent(now: number, count: number, startOf: (ms: number) => number, length: number): Period[] {
  const periods: Period[] = [];
  let start = startOf(now);
  for (let i = 0; i < count; i++) {
    // Half a day past the nominal end lands safely inside the next period, even across daylight saving.
    const end = startOf(start + length + DAY / 2);
    periods.unshift({ start, end, label: labelFormat.format(start), complete: end <= now });
    start = startOf(start - DAY / 2);
  }
  return periods;
}

/** The last `count` weeks, oldest first, ending with the week containing `now`. */
export const recentWeeks = (now: number, count: number) => recent(now, count, weekStart, 7 * DAY);

/** The last `count` days, oldest first, ending with today. */
export const recentDays = (now: number, count: number) => recent(now, count, dayStart, DAY);

/** The index of the period containing `ms`, or -1 if it's outside them all. */
export function periodIndex(periods: Period[], ms: number): number {
  return periods.findIndex((p) => ms >= p.start && ms < p.end);
}
export const weekIndex = periodIndex;
