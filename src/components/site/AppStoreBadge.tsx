import { DeviceIcon } from "@/components/ui/icons";
import { SITE } from "@/lib/site";

/**
 * "Coming soon" until SITE.appStoreId is set, then a link to the listing.
 * TODO(launch): once the listing is live, swap this for Apple's official
 * "Download on the App Store" badge (Apple's marketing guidelines require it).
 */
export function AppStoreBadge({ tone = "dark", className = "" }: { tone?: "dark" | "light"; className?: string }) {
  const colours = tone === "dark" ? "bg-frame text-white" : "bg-white text-frame";
  const inner = (
    <>
      <DeviceIcon className="size-6 shrink-0" />
      <span className="flex flex-col text-left leading-tight">
        <span className="text-[11px] font-medium opacity-80">{SITE.appStoreUrl ? "Download on the" : "Coming soon to the"}</span>
        <span className="text-[17px] font-semibold tracking-tight">App Store</span>
      </span>
    </>
  );
  const classes = `inline-flex h-[52px] items-center gap-2.5 rounded-xl px-4 ${colours} ${className}`;

  return SITE.appStoreUrl ? (
    <a href={SITE.appStoreUrl} className={`${classes} transition hover:opacity-90`}>
      {inner}
    </a>
  ) : (
    <span className={classes}>{inner}</span>
  );
}
