import type { Metadata } from "next";
import Link from "next/link";
import { FilterIcon, FlagIcon, GraduationIcon, LockIcon, PauseIcon, PhoneOffIcon } from "@/components/ui/icons";
import { SITE } from "@/lib/site";

export const metadata: Metadata = {
  title: "Safety",
  description: "How Sidekick keeps York students safe: verified accounts, blocking by phone number, private details, community rules and reporting.",
  alternates: { canonical: "/safety" },
};

const PROTECTIONS = [
  {
    icon: GraduationIcon,
    title: "Verified York students",
    text: "Everyone signs in with a code sent to their @my.yorku.ca email, and each email and phone number can belong to one account only.",
  },
  {
    icon: PhoneOffIcon,
    title: "Block by phone number",
    text: "Add someone’s number in Settings and you won’t see each other anywhere on Sidekick, even if they join later. Nobody is told.",
  },
  {
    icon: LockIcon,
    title: "Private details stay private",
    text: "Profiles show your first name and age, never your email, phone number or birth date. Profiles aren’t public on the web.",
  },
  {
    icon: FilterIcon,
    title: "You choose who you see",
    text: "See everyone, or only people of your own gender. The filter works both ways, so you’re only shown to the people you see.",
  },
  {
    icon: PauseIcon,
    title: "Take a break",
    text: "Turn off Account active in Settings to hide your profile and pause chats. Everything is saved for when you’re back.",
  },
  {
    icon: FlagIcon,
    title: "Report anything",
    text: "If someone makes you uncomfortable, block them and tell us. We look into every report, and remove people who break our rules.",
  },
];

const RULES = [
  { title: "Be real", text: "Use your real first name and your own photos. One account per person." },
  { title: "Be kind", text: "No harassment, bullying, threats or hate. Treat people the way you would in class." },
  { title: "Friends, not dates", text: "Sidekick is only for friendship. Don’t use it for dating, hookups or sexual content." },
  { title: "Respect privacy", text: "Don’t share screenshots of anyone’s profile or messages, or their personal information, without their consent." },
  { title: "No selling", text: "No spam, scams, recruiting or promotion, and never ask anyone for money." },
  { title: "Respect a no", text: "If someone doesn’t reply, dismisses you or unfriends you, let it go. Don’t try to reach them another way." },
];

const MEETING_TIPS = [
  "Meet somewhere public on campus for the first time, like a café, the library or a busy common area.",
  "Tell a friend where you’re going and who you’re meeting.",
  "Keep chatting on Sidekick until you trust someone, before sharing your number or socials.",
  "Get yourself there and back on your own terms.",
  "Trust your instincts. It’s always okay to leave, block or stop replying.",
];

export default function SafetyPage() {
  const email = <a href={`mailto:${SITE.supportEmail}`}>{SITE.supportEmail}</a>;
  return (
    <div className="site-container py-16 sm:py-20">
      <div className="mx-auto max-w-4xl">
        <p className="eyebrow text-green">Safety</p>
        <h1 className="mt-3 font-serif text-4xl font-semibold text-balance sm:text-5xl">Safe by design, from your first swipe.</h1>
        <p className="mt-5 max-w-2xl text-lg leading-relaxed text-ink-soft">
          Sidekick is built for making friends at university, and that only works if everyone feels comfortable. Here’s what protects you, what we
          expect from everyone, and what to do if something goes wrong.
        </p>

        <h2 className="mt-14 font-serif text-2xl font-semibold sm:text-3xl">Built-in protections</h2>
        <ul className="mt-6 grid gap-4 sm:grid-cols-2">
          {PROTECTIONS.map(({ icon: Icon, title, text }) => (
            <li key={title} className="card flex gap-4 p-5">
              <span className="grid size-10 shrink-0 place-items-center rounded-2xl bg-green-soft text-green">
                <Icon className="size-5" />
              </span>
              <span>
                <span className="block font-serif text-lg font-semibold">{title}</span>
                <span className="mt-1 block text-[15px] leading-relaxed text-ink-soft">{text}</span>
              </span>
            </li>
          ))}
        </ul>

        <h2 id="community-guidelines" className="mt-16 font-serif text-2xl font-semibold sm:text-3xl">
          Community guidelines
        </h2>
        <p className="mt-3 max-w-2xl leading-relaxed text-ink-soft">
          Everyone on Sidekick agrees to these when they join. They’re the short version of our <Link href="/terms" className="font-semibold text-green underline">Terms of Use</Link>.
          Breaking them can get content removed or an account closed.
        </p>
        <ol className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {RULES.map((rule, i) => (
            <li key={rule.title} className="rounded-3xl bg-green-soft p-5">
              <span className="font-serif text-sm font-semibold text-green">0{i + 1}</span>
              <span className="mt-1 block font-serif text-lg font-semibold">{rule.title}</span>
              <span className="mt-1 block text-[15px] leading-relaxed text-ink-soft">{rule.text}</span>
            </li>
          ))}
        </ol>

        <div className="mt-16 grid gap-6 lg:grid-cols-2">
          <section className="card p-6 sm:p-8">
            <h2 className="font-serif text-2xl font-semibold">Meeting up</h2>
            <p className="mt-2 text-ink-soft">Most Sidekick friendships start with a coffee or a study session. A few habits keep it easy:</p>
            <ul className="mt-4 flex flex-col gap-3">
              {MEETING_TIPS.map((tip) => (
                <li key={tip} className="flex gap-3 text-[15px] leading-relaxed text-ink-soft">
                  <span className="mt-2 size-2 shrink-0 rounded-full bg-mustard" />
                  {tip}
                </li>
              ))}
            </ul>
          </section>

          <section id="report" className="card p-6 sm:p-8 [&_a]:font-semibold [&_a]:text-green [&_a]:underline">
            <h2 className="font-serif text-2xl font-semibold">Reporting someone</h2>
            <ol className="mt-4 flex flex-col gap-4 text-[15px] leading-relaxed text-ink-soft">
              <li>
                <strong className="text-ink">1. Block them.</strong> In Settings, choose Block a phone number and enter theirs. You’ll disappear from
                each other right away.
              </li>
              <li>
                <strong className="text-ink">2. Tell us.</strong> Email {email} with their first name, what happened and when. Screenshots help.
              </li>
              <li>
                <strong className="text-ink">3. We look into it.</strong> We can remove content, or suspend or close accounts that break our rules.
                We never tell anyone who reported them.
              </li>
            </ol>
          </section>
        </div>

        <section className="mt-6 rounded-3xl bg-frame p-6 text-white sm:p-8">
          <h2 className="font-serif text-2xl font-semibold">If you need help now</h2>
          <ul className="mt-4 grid gap-4 text-[15px] leading-relaxed text-white/80 sm:grid-cols-2">
            <li>
              <strong className="block text-white">In immediate danger</strong>
              Call <a href="tel:911" className="font-semibold text-mustard underline">911</a>.
            </li>
            <li>
              <strong className="block text-white">Want to talk to someone</strong>
              Good2Talk is free, confidential support for Ontario post-secondary students, 24/7. Call{" "}
              <a href="tel:+18669255454" className="font-semibold text-mustard underline">
                1-866-925-5454
              </a>{" "}
              or text GOOD2TALKON to 686868.
            </li>
          </ul>
        </section>
      </div>
    </div>
  );
}
