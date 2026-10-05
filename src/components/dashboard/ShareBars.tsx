import Link from "next/link";
import { count } from "@/components/dashboard/format";
import { signupFiltersQuery } from "@/lib/signup-filters";
import type { Share } from "@/server/waitlist-insights";

/**
 * A breakdown as horizontal bars, largest first: one colour, the length is the
 * count, and "Everything else" in grey since it's many small groups. Each label
 * links to exactly those signups in the list below.
 */
export function ShareBars({ shares, total }: { shares: Share[]; total: number }) {
  const max = Math.max(1, ...shares.map((s) => s.count));
  if (!total) return <p className="text-sm text-ink-soft">No signups yet.</p>;
  return (
    <ul className="flex flex-col gap-3.5">
      {shares.map((share) => (
        <li key={share.label}>
          <div className="flex items-baseline justify-between gap-3 text-sm">
            {share.filters ? (
              <Link href={`/dashboard/waitlist${signupFiltersQuery(share.filters)}#people`} className="min-w-0 truncate font-medium hover:underline">
                {share.label}
              </Link>
            ) : (
              <span className="min-w-0 truncate font-medium text-ink-soft">{share.label}</span>
            )}
            <span className="shrink-0 text-ink-soft tabular-nums">
              <span className="font-semibold text-ink">{count(share.count)}</span> · {Math.round((share.count / total) * 100)}%
            </span>
          </div>
          <div className="mt-1.5 h-2">
            <div
              className={`h-full rounded-r-[4px] ${share.filters ? "bg-accent" : "bg-[var(--spark)]"}`}
              style={{ width: share.count ? `max(2px, ${(share.count / max) * 100}%)` : 0 }}
            />
          </div>
        </li>
      ))}
    </ul>
  );
}
