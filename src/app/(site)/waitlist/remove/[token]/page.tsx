import type { Metadata } from "next";
import Link from "next/link";
import { SITE } from "@/lib/site";
import { maskEmail } from "@/lib/waitlist";
import { removeFromWaitlist } from "@/server/actions/waitlist";
import { findSignupByRemovalToken } from "@/server/waitlist";

// Where the confirmation email's "Not you? Remove it" link goes. Opening it only
// asks: mail scanners open links, so removing takes pressing the button.

export const metadata: Metadata = { title: "Remove your email", robots: { index: false } };

export default async function RemoveFromWaitlistPage({ params }: PageProps<"/waitlist/remove/[token]">) {
  const { token } = await params;
  const signup = await findSignupByRemovalToken(token);

  return (
    <section className="site-container flex justify-center py-20 sm:py-28">
      <div className="card w-full max-w-lg p-8">
        {signup ? (
          <>
            <h1 className="font-serif text-3xl font-semibold text-balance">Remove this email from the waitlist?</h1>
            <p className="mt-3 leading-relaxed text-ink-soft">
              <strong className="text-ink">{maskEmail(signup.email)}</strong> is on the Sidekick waitlist. If you didn’t sign up, someone may have
              typed your email by mistake. Removing it deletes it from our list, and we won’t email it again.
            </p>
            <form action={removeFromWaitlist} className="mt-7 flex flex-wrap items-center gap-3">
              <input type="hidden" name="token" value={token} />
              <button type="submit" className="btn-primary">
                Remove my email
              </button>
              <Link href="/" className="btn-ghost">
                Keep me on the list
              </Link>
            </form>
          </>
        ) : (
          <>
            <h1 className="font-serif text-3xl font-semibold text-balance">This link has already been used.</h1>
            <p className="mt-3 leading-relaxed text-ink-soft">
              The email it was for isn’t on the waitlist anymore, or the link was cut short. If we still email you, write to{" "}
              <a href={`mailto:${SITE.supportEmail}`} className="font-semibold text-green underline">
                {SITE.supportEmail}
              </a>{" "}
              and we’ll remove you.
            </p>
            <Link href="/" className="btn-secondary mt-7">
              Go to Sidekick
            </Link>
          </>
        )}
      </div>
    </section>
  );
}
