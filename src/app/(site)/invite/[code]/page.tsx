import type { Metadata } from "next";
import Link from "next/link";
import { AppIconArt } from "@/components/brand/AppIconArt";
import { AppStoreBadge } from "@/components/site/AppStoreBadge";
import { WaitlistForm } from "@/components/waitlist/WaitlistForm";
import { SITE } from "@/lib/site";

// Where an invite link (trysidekick.ca/invite/…) lands without the app: on a
// computer, or a phone that doesn't have it yet. With the app installed, the
// link opens the app instead (see src/server/app-links.ts). The invite code is
// for the app: this page only passes it on, in Safari's banner, and never stores it.

const TITLE = "You’re invited to Sidekick";
const DESCRIPTION = "A friend wants you on Sidekick, the friends-only app for university students, starting at York.";

// Link previews in messages use this title and description. No openGraph here:
// setting it would replace the site's share image.
export async function generateMetadata({ params }: PageProps<"/invite/[code]">): Promise<Metadata> {
  const { code } = await params;
  return {
    title: { absolute: TITLE },
    description: DESCRIPTION,
    robots: { index: false },
    // On an iPhone with the app installed, Safari's banner hands it this invite.
    ...(SITE.appStoreId && { itunes: { appId: SITE.appStoreId, appArgument: `${SITE.url}/invite/${encodeURIComponent(code)}` } }),
  };
}

export default function InvitePage() {
  return (
    <section className="relative overflow-hidden">
      <div aria-hidden className="pointer-events-none absolute -top-48 -right-40 size-[36rem] rounded-full bg-green-soft" />
      <div aria-hidden className="pointer-events-none absolute -bottom-32 -left-32 hidden size-72 rounded-full bg-mustard-soft sm:block" />
      <div className="site-container relative flex flex-col items-center py-16 text-center sm:py-24">
        <div className="overflow-hidden rounded-[22px] shadow-card">
          <AppIconArt size={96} rounded />
        </div>
        <p className="eyebrow mt-8 text-green">You’re invited</p>
        <h1 className="mt-3 max-w-2xl font-serif text-4xl leading-tight font-semibold text-balance sm:text-6xl">
          A friend wants you on <span className="text-green italic">Sidekick.</span>
        </h1>
        <p className="mt-5 max-w-xl text-lg leading-relaxed text-ink-soft">
          Sidekick is a friends-only app for university students, starting at York. Swipe through people who share your campus, major and
          interests, and turn a conversation into plans.
        </p>

        {SITE.appStoreUrl ? (
          <>
            <AppStoreBadge className="mt-9" />
            <p className="mt-4 max-w-md text-sm text-ink-soft">Once you have the app, open this link again and it goes straight to Sidekick.</p>
            <p className="mt-8 text-sm text-ink-soft">
              On Android?{" "}
              <Link href="/join?ref=invite" className="font-semibold text-green underline">
                Join the waitlist
              </Link>
              .
            </p>
          </>
        ) : (
          <>
            <p className="mt-8 max-w-md font-semibold">Sidekick isn’t on the App Store yet. Join the waitlist and we’ll email you the day it opens.</p>
            <div className="mt-6 flex w-full justify-center">
              <WaitlistForm source="invite" />
            </div>
            <AppStoreBadge className="mt-8" />
          </>
        )}

        <Link href="/#how-it-works" className="mt-12 text-sm font-semibold text-green underline">
          See how Sidekick works
        </Link>
      </div>
    </section>
  );
}
