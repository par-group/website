import { count } from "@/components/dashboard/format";
import type { Period } from "@/lib/calendar";

/** A round top for the axis, and the step between its gridlines (at most 4 steps). */
export function axisScale(max: number): { top: number; step: number } {
  for (let magnitude = 1; ; magnitude *= 10) {
    for (const step of [1, 2, 5].map((m) => m * magnitude)) {
      const top = Math.max(step, Math.ceil(max / step) * step);
      if (top / step <= 4) return { top, step };
    }
  }
}

const describe = (day: Period, n: number) => `${day.label}${day.complete ? "" : " (today so far)"}: ${count(n)} ${n === 1 ? "signup" : "signups"}`;

/**
 * Signups per day, as columns. Built from HTML rather than a scaled SVG so the
 * text stays the same size at any width. Hovering or focusing a day shows its
 * count; the table under the chart has every value.
 */
export function DailyChart({ days, label }: { days: { day: Period; count: number }[]; label: string }) {
  const { top, step } = axisScale(Math.max(0, ...days.map((d) => d.count)));
  const ticks = Array.from({ length: top / step + 1 }, (_, i) => i * step);
  const labelEvery = Math.ceil(days.length / 6);
  const height = (n: number) => `${(n / top) * 100}%`;

  return (
    <figure aria-label={label}>
      <div className="relative h-48 pl-10">
        {ticks.map((tick) => (
          <div key={tick} aria-hidden className="absolute right-0 left-10 border-t border-line" style={{ bottom: height(tick) }}>
            <span className="absolute -top-2 -left-10 w-8 text-right text-[11px] leading-none text-ink-soft tabular-nums">{count(tick)}</span>
          </div>
        ))}
        <ol className="relative flex h-full items-end">
          {days.map(({ day, count: n }, i) => {
            const align = i < 3 ? "left-0" : i > days.length - 4 ? "right-0" : "left-1/2 -translate-x-1/2";
            return (
              <li
                key={day.start}
                tabIndex={0}
                aria-label={describe(day, n)}
                className="group relative flex h-full flex-1 items-end justify-center outline-none focus-visible:bg-green-soft/60"
              >
                {/* Today is still filling in, so it's lighter. */}
                <div
                  className={`w-[62%] max-w-6 rounded-t-[4px] transition-opacity group-hover:opacity-75 ${day.complete ? "bg-accent" : "bg-accent/45"}`}
                  style={{ height: height(n) }}
                />
                <span
                  aria-hidden
                  className={`pointer-events-none absolute z-10 hidden rounded-lg bg-frame px-2 py-1 text-xs whitespace-nowrap text-white shadow-card group-hover:block group-focus-visible:block ${align}`}
                  style={{ bottom: `calc(${height(n)} + 6px)` }}
                >
                  <strong className="font-semibold">{count(n)}</strong> · {day.label}
                  {!day.complete && " (so far)"}
                </span>
              </li>
            );
          })}
        </ol>
      </div>
      <div aria-hidden className="flex pt-2 pl-10">
        {days.map(({ day }, i) => (
          <span key={day.start} className="flex-1 text-center text-[11px] whitespace-nowrap text-ink-soft">
            {(days.length - 1 - i) % labelEvery === 0 ? day.label : ""}
          </span>
        ))}
      </div>
    </figure>
  );
}
