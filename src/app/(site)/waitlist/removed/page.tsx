import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "Removed from the waitlist", robots: { index: false } };

export default function RemovedFromWaitlistPage() {
  return (
    <section className="site-container flex justify-center py-20 sm:py-28">
      <div className="card w-full max-w-lg p-8">
        <h1 className="font-serif text-3xl font-semibold">You’re off the waitlist.</h1>
        <p className="mt-3 leading-relaxed text-ink-soft">
          That email isn’t on the Sidekick waitlist anymore, and we won’t email it again. If you change your mind, you can join again anytime.
        </p>
        <Link href="/" className="btn-secondary mt-7">
          Back to Sidekick
        </Link>
      </div>
    </section>
  );
}
