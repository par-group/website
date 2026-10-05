"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  { href: "/dashboard", label: "Overview" },
  { href: "/dashboard/waitlist", label: "Waitlist" },
  { href: "/dashboard/setup", label: "Setup" },
] as const;

export function DashboardNav() {
  const pathname = usePathname();
  return (
    <nav aria-label="Dashboard" className="-mb-px flex gap-1 overflow-x-auto [scrollbar-width:none]">
      {TABS.map(({ href, label }) => {
        const current = href === "/dashboard" ? pathname === href : pathname.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            aria-current={current ? "page" : undefined}
            className={`border-b-2 px-3 py-3 text-sm font-semibold whitespace-nowrap transition ${
              current ? "border-accent text-ink" : "border-transparent text-ink-soft hover:border-line hover:text-ink"
            }`}
          >
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
