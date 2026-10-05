import type { Week } from "@/lib/calendar";

export type TableCell = { value: string; detail?: string } | null;
export type TableRow = { group: string } | { label: string; cells: TableCell[] };

/** Every number on the dashboard, week by week: the table twin of the tiles above it. */
export function WeeklyTable({ weeks, rows }: { weeks: Week[]; rows: TableRow[] }) {
  return (
    <div className="overflow-x-auto rounded-3xl bg-surface shadow-card">
      <table className="w-full min-w-[60rem] border-collapse text-sm">
        <thead>
          <tr className="border-b border-line text-left">
            <th scope="col" className="sticky left-0 bg-surface px-5 py-3 font-semibold">
              Week of
            </th>
            {weeks.map((week) => (
              <th key={week.start} scope="col" className="px-3 py-3 text-right font-semibold whitespace-nowrap">
                {week.label}
                {!week.complete && <span className="block text-xs font-normal text-ink-soft">so far</span>}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) =>
            "group" in row ? (
              <tr key={row.group}>
                <th scope="colgroup" colSpan={weeks.length + 1} className="sticky left-0 bg-surface px-5 pt-5 pb-1 text-left">
                  <span className="label mb-0">{row.group}</span>
                </th>
              </tr>
            ) : (
              <tr key={row.label} className="border-t border-line/60">
                <th scope="row" className="sticky left-0 bg-surface px-5 py-2.5 text-left font-medium whitespace-nowrap">
                  {row.label}
                </th>
                {row.cells.map((cell, i) => (
                  <td key={weeks[i].start} className={`px-3 py-2.5 text-right tabular-nums ${weeks[i].complete ? "" : "text-ink-soft"}`}>
                    {cell ? (
                      <>
                        {cell.value}
                        {cell.detail && <span className="block text-xs text-ink-soft">{cell.detail}</span>}
                      </>
                    ) : (
                      <span className="text-ink-soft" title="Nothing to measure yet">
                        –
                      </span>
                    )}
                  </td>
                ))}
              </tr>
            ),
          )}
        </tbody>
      </table>
    </div>
  );
}
