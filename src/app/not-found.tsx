import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "Page not found" };

export default function NotFound() {
  return (
    <div className="site-container flex flex-col items-center gap-6 py-28 text-center">
      <p className="eyebrow text-green">404</p>
      <div>
        <h1 className="font-serif text-4xl font-semibold sm:text-5xl">We couldn’t find that page.</h1>
        <p className="mx-auto mt-3 max-w-sm text-ink-soft">It may have moved. Try the home page, or ask us on the support page.</p>
      </div>
      <div className="flex flex-col gap-3 sm:flex-row">
        <Link href="/" className="btn-primary">
          Go to Sidekick
        </Link>
        <Link href="/support" className="btn-secondary">
          Get help
        </Link>
      </div>
    </div>
  );
}
