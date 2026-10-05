import type { Change } from "@/components/dashboard/format";

/** One of the weekly questions: what it's called, what it tells you, and its numbers. */
export function StatTile({ title, why, tag, children }: { title: string; why: string; tag?: string; children: React.ReactNode }) {
  return (
    <section className="card flex flex-col gap-5 p-6">
      <header>
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="font-semibold">{title}</h2>
          {tag && <span className="rounded-full bg-mustard-soft px-2.5 py-0.5 text-xs font-semibold text-accent-ink">{tag}</span>}
        </div>
        <p className="mt-1 text-sm text-ink-soft">{why}</p>
      </header>
      {children}
    </section>
  );
}

/** A headline number: its value, what it's of, the change from the week before, and the trend. */
export function Figure({
  label,
  value,
  caption,
  change,
  size = "large",
  trend,
}: {
  /** Shown above the value when a tile has more than one number. */
  label?: string;
  value: string;
  caption: React.ReactNode;
  change?: Change | null;
  size?: "large" | "small";
  trend?: React.ReactNode;
}) {
  const tone = change?.good === true ? "text-green" : change?.good === false ? "text-danger" : "text-ink-soft";
  return (
    <div className="flex items-end justify-between gap-4">
      <div className="min-w-0">
        {label && <p className="mb-1 text-sm font-semibold text-ink-soft">{label}</p>}
        <p className={`font-semibold tracking-tight ${size === "large" ? "text-4xl" : "text-2xl"}`}>{value}</p>
        <p className="mt-1 text-sm text-ink-soft">{caption}</p>
        {change && <p className={`mt-1 text-sm font-semibold ${tone}`}>{change.text}</p>}
      </div>
      {trend}
    </div>
  );
}

/** What a tile shows when there's no number for it. */
export function NoData({ children }: { children: React.ReactNode }) {
  return <p className="rounded-2xl bg-bg px-4 py-3 text-sm text-ink-soft">{children}</p>;
}

/** A single headline number in a row of them. */
export function Kpi({ label, value, caption, change }: { label: string; value: string; caption?: React.ReactNode; change?: Change | null }) {
  const tone = change?.good === true ? "text-green" : change?.good === false ? "text-danger" : "text-ink-soft";
  return (
    <div className="card p-4 sm:p-5">
      <p className="text-sm font-semibold text-ink-soft">{label}</p>
      <p className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">{value}</p>
      {caption && <p className="mt-1 text-sm text-ink-soft">{caption}</p>}
      {change && <p className={`mt-1 text-sm font-semibold ${tone}`}>{change.text}</p>}
    </div>
  );
}
