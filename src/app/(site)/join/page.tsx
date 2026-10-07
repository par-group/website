import type { Metadata } from "next";
import Link from "next/link";
import { AppStoreBadge } from "@/components/site/AppStoreBadge";
import { CheckIcon, DeviceIcon, MailIcon } from "@/components/ui/icons";
import { WaitlistForm } from "@/components/waitlist/WaitlistForm";

export const metadata: Metadata = {
  title: "Join the waitlist",
  description: "Join the Sidekick waitlist and hear first when the friends-only app for university students opens at York.",
  alternates: { canonical: "/join" },
};

const NEXT_STEPS = [
  { icon: MailIcon, title: "Join with your York email", text: "Your @my.yorku.ca address. We’ll send you a confirmation right away." },
  { icon: DeviceIcon, title: "Tell us your phone", text: "One optional question, iPhone or Android, helps us plan the launch." },
  { icon: CheckIcon, title: "Hear first at launch", text: "Then only news about the launch, and every email has a link to leave the list." },
];

export default function JoinPage() {
  return (
    <section className="relative overflow-hidden">
      <div aria-hidden className="pointer-events-none absolute -top-48 -right-40 size-[36rem] rounded-full bg-green-soft" />
      <div aria-hidden className="pointer-events-none absolute -bottom-32 -left-32 hidden size-72 rounded-full bg-mustard-soft sm:block" />
      <div className="site-container relative py-16 sm:py-24">
        <div className="mx-auto flex max-w-2xl flex-col items-center text-center">
          <p className="eyebrow text-green">Join the waitlist</p>
          <h1 className="mt-3 font-serif text-4xl leading-tight font-semibold text-balance sm:text-6xl">
            Be first in when Sidekick <span className="text-green italic">opens at York.</span>
          </h1>
          <p className="mt-5 max-w-xl text-lg leading-relaxed text-ink-soft">
            Leave your York email and we’ll tell you the day Sidekick launches. The waitlist is for York students, so use your @my.yorku.ca
            address.
          </p>
          <div className="mt-9 flex w-full justify-center">
            <WaitlistForm />
          </div>
        </div>

        <ol aria-label="What happens next" className="mx-auto mt-16 grid max-w-4xl gap-4 sm:grid-cols-3">
          {NEXT_STEPS.map(({ icon: Icon, title, text }) => (
            <li key={title} className="card flex flex-col gap-3 p-6">
              <span className="grid size-10 place-items-center rounded-2xl bg-green-soft text-green">
                <Icon className="size-5" />
              </span>
              <span>
                <span className="block font-serif text-lg font-semibold">{title}</span>
                <span className="mt-1 block text-[15px] leading-relaxed text-ink-soft">{text}</span>
              </span>
            </li>
          ))}
        </ol>

        <div className="mt-12 flex flex-col items-center gap-4 text-center">
          <AppStoreBadge />
          <p className="max-w-md text-sm text-ink-soft">
            We never sell your email or share it for advertising. See our{" "}
            <Link href="/privacy" className="font-semibold text-green underline">
              Privacy Policy
            </Link>
            .
          </p>
        </div>
      </div>
    </section>
  );
}
