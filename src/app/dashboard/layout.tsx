import type { Metadata } from "next";
import Link from "next/link";
import { Logo } from "@/components/brand/Logo";
import { DashboardNav } from "@/components/dashboard/DashboardNav";
import { requireDashboardAccess } from "@/server/dashboard-auth";

export const metadata: Metadata = {
  title: { default: "Dashboard", template: "%s · Sidekick dashboard" },
  robots: { index: false, follow: false },
};

export default async function DashboardLayout({ children }: LayoutProps<"/dashboard">) {
  await requireDashboardAccess();
  return (
    <div className="flex min-h-dvh flex-col [--spark:#8fa6a3]">
      <header className="sticky top-0 z-30 border-b border-line bg-surface/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-x-6 px-5 sm:px-8">
          <div className="flex h-14 items-center gap-3">
            <Link href="/dashboard" aria-label="Dashboard overview">
              <Logo className="text-xl" />
            </Link>
            <span className="rounded-full bg-green-soft px-2.5 py-0.5 text-xs font-semibold text-green">Dashboard</span>
          </div>
          <div className="order-last w-full sm:order-none sm:w-auto">
            <DashboardNav />
          </div>
          <Link href="/" className="ml-auto text-sm font-semibold text-ink-soft transition hover:text-ink">
            View site <span aria-hidden>↗</span>
          </Link>
        </div>
      </header>
      <main id="main" className="mx-auto w-full max-w-7xl flex-1 px-5 py-10 sm:px-8 sm:py-12">
        {children}
      </main>
    </div>
  );
}
