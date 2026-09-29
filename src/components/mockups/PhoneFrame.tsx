/**
 * A phone outline for the app mockups. The screen content is decorative, so it's
 * hidden from screen readers and described by `label` instead.
 */
export function PhoneFrame({ label, children, className = "" }: { label: string; children: React.ReactNode; className?: string }) {
  return (
    <div role="img" aria-label={label} className={`relative w-full max-w-[300px] ${className}`}>
      <div className="overflow-hidden rounded-[2.75rem] border-[10px] border-frame bg-bg shadow-phone">
        <div className="relative flex aspect-[9/19] flex-col overflow-hidden text-left">
          <div className="flex items-center justify-between px-6 pt-2.5 pb-1 text-[11px] font-semibold text-ink">
            <span>9:41</span>
            <span className="h-5 w-20 rounded-full bg-frame" />
            <span className="flex items-end gap-0.5">
              <span className="h-1.5 w-[3px] rounded-sm bg-ink" />
              <span className="h-2 w-[3px] rounded-sm bg-ink" />
              <span className="h-2.5 w-[3px] rounded-sm bg-ink" />
              <span className="ml-1 h-2.5 w-5 rounded-[3px] border border-ink p-px">
                <span className="block h-full w-3/4 rounded-[1px] bg-ink" />
              </span>
            </span>
          </div>
          {children}
        </div>
      </div>
    </div>
  );
}
