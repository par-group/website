import type { Metadata } from "next";
import Link from "next/link";
import { ChatScreen, DiscoverScreen, InboxScreen, SignInScreen, type DiscoverProfile } from "@/components/mockups/AppScreens";
import { PhoneFrame } from "@/components/mockups/PhoneFrame";
import { AppStoreBadge } from "@/components/site/AppStoreBadge";
import { FaqList, type Faq } from "@/components/site/FaqList";
import { SectionHeading } from "@/components/site/SectionHeading";
import {
  ArrowRightIcon,
  CommentIcon,
  EyeOffIcon,
  FilterIcon,
  FlagIcon,
  GraduationIcon,
  LockIcon,
  MapPinIcon,
  PauseIcon,
  PhoneOffIcon,
  PlusIcon,
  UsersIcon,
} from "@/components/ui/icons";
import { WaitlistForm } from "@/components/waitlist/WaitlistForm";
import { SITE } from "@/lib/site";

export const metadata: Metadata = { alternates: { canonical: "/" } };

const MAYA: DiscoverProfile = {
  name: "Maya",
  age: 20,
  program: "Psychology · BA · Keele",
  emoji: "☕",
  tint: "teal",
  tags: [{ label: "☕ Coffee", shared: true }, { label: "🎲 Board games", shared: true }, { label: "📷 Photography" }],
  prompt: { question: "A perfect study break", answer: "Bubble tea run, then pretending the library is a café." },
};

const JORDAN: DiscoverProfile = {
  name: "Jordan",
  age: 21,
  program: "Kinesiology · BSc · Keele",
  emoji: "🏀",
  tint: "deep",
  tags: [{ label: "🏀 Basketball", shared: true }, { label: "🎧 Hip-hop" }, { label: "🍜 Ramen", shared: true }],
  prompt: { question: "A hill I will die on…", answer: "8am classes should be illegal." },
};

const TRUST = [
  { icon: GraduationIcon, title: "York students only", text: "Every account is verified with a @my.yorku.ca email." },
  { icon: UsersIcon, title: "Friends, not dates", text: "Built for friendship. Dating isn’t allowed." },
  { icon: EyeOffIcon, title: "No ads, no tracking", text: "We never sell your information." },
  { icon: LockIcon, title: "Private by default", text: "Your email, phone and birth date are never shown." },
];

const STEPS = [
  {
    title: "Verify you’re at York",
    text: "Sign in with your @my.yorku.ca email and a one-time code. No passwords, and no one who isn’t a York student.",
    label: "Sidekick sign-in screen: enter the 6-digit code sent to your York email.",
    screen: <SignInScreen />,
  },
  {
    title: "Swipe Friend or pass",
    text: "Add four photos, a few interests and three prompts. Then meet students who share your campus, major and interests.",
    label: "Sidekick Discover screen: Jordan, 21, Kinesiology at Keele, with Friend and pass buttons.",
    screen: <DiscoverScreen profile={JORDAN} />,
  },
  {
    title: "Reply, match, make plans",
    text: "Comment on a photo or prompt to break the ice. When it’s mutual, you’re friends and the chat opens.",
    label: "Sidekick chat screen: you and Maya are now friends and plan to study at Scott Library.",
    screen: <ChatScreen />,
  },
];

const FEATURES = [
  {
    title: "Matched on what you share",
    text: "Your deck leans toward people on your campus, in your major and into the same things, with a few surprises mixed in.",
  },
  { title: "Start with a reply", text: "Comment on someone’s photo, prompt or tag. If they reply, you’re friends. No mutual swipe needed." },
  { title: "No awkward passes", text: "Passing is private and nobody is told. People you pass on get one second look after 30 days." },
  { title: "Friends, not dates", text: "Study buddies, gym partners and people to grab lunch with between classes. Dating and hookups aren’t allowed." },
];

const SAFETY = [
  { icon: GraduationIcon, title: "Verified York students", text: "Every account is confirmed with a code sent to a @my.yorku.ca email. One account per person." },
  { icon: PhoneOffIcon, title: "Block by phone number", text: "Add someone’s number and you’ll never see each other, even if they join later. They’re never told." },
  { icon: LockIcon, title: "Private details stay private", text: "Your email, phone number and birth date are never shown. Profiles show your first name and age." },
  { icon: FilterIcon, title: "You choose who you see", text: "See everyone, or only people of your own gender, and only be shown to them too." },
  { icon: PauseIcon, title: "Take a break anytime", text: "Deactivate from Settings to hide your profile. Your friendships are saved for when you’re back." },
  { icon: FlagIcon, title: "Easy to report", text: "If anyone makes you uncomfortable, tell us and we’ll look into it. You can block them right away too." },
];

const CAMPUSES = [
  { name: "Keele", text: "The main campus in North York." },
  { name: "Glendon", text: "The bilingual campus in midtown Toronto." },
  { name: "Markham", text: "York’s newest campus, in downtown Markham." },
];

const FAQ: Faq[] = [
  {
    question: "When does Sidekick launch?",
    answer: (
      <p>
        Sidekick is coming to the App Store soon, starting with students at York University. Everyone on the waitlist hears first, and we’ll only
        email you about the launch.
      </p>
    ),
  },
  {
    question: "Is Sidekick a dating app?",
    answer: (
      <p>
        No. Sidekick uses the swipe you know from dating apps, but only for friendship. Using it for dating or hookups is against our{" "}
        <Link href="/terms">Terms</Link>.
      </p>
    ),
  },
  {
    question: "Who can join?",
    answer: (
      <p>
        York University students who are 18 or older. You sign in with your <strong>@my.yorku.ca</strong> email, so everyone you meet is a verified
        York student. The waitlist is for York students too: join with your York email.
      </p>
    ),
  },
  {
    question: "I’m not at York. Can I still sign up?",
    answer: (
      <p>
        Not yet. Sidekick is starting with York, so the waitlist takes <strong>@my.yorku.ca</strong> addresses only for now. More campuses come
        after launch: tell us where you study at <a href={`mailto:${SITE.supportEmail}`}>{SITE.supportEmail}</a> and we’ll keep you posted.
      </p>
    ),
  },
  {
    question: "Is there an Android app?",
    answer: (
      <p>iPhone comes first. If you’re on Android, say so when you join the waitlist. It helps us decide what to build next.</p>
    ),
  },
  ...(SITE.webPreviewUrl
    ? [
        {
          question: "Can I try it before the App Store launch?",
          answer: (
            <p>
              York students can try an early version in the browser at <a href={SITE.webPreviewUrl}>{SITE.webPreviewUrl.replace(/^https?:\/\/(www\.)?/, "")}</a>.
              It’s a preview, so things may change before the app launches.
            </p>
          ),
        },
      ]
    : []),
  {
    question: "Is Sidekick connected to York University?",
    answer: <p>No. Sidekick is independent, and isn’t operated, affiliated with or endorsed by York University.</p>,
  },
  {
    question: "What do you do with my email?",
    answer: (
      <p>
        We send one email to confirm you joined, then only news about Sidekick’s launch. We never sell it or share it for advertising. Every email
        has a link to remove yourself, or ask us at <a href={`mailto:${SITE.supportEmail}`}>{SITE.supportEmail}</a>. See our{" "}
        <Link href="/privacy">Privacy Policy</Link>.
      </p>
    ),
  },
];

const ORGANIZATION_JSON_LD = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: SITE.name,
  url: SITE.url,
  logo: `${SITE.url}/icon.svg`,
  email: SITE.supportEmail,
  description: SITE.description,
};

export default function HomePage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(ORGANIZATION_JSON_LD) }} />

      {/* Hero, with the main waitlist form */}
      <section id="waitlist" className="relative overflow-hidden">
        <div aria-hidden className="pointer-events-none absolute -top-48 -right-40 size-[40rem] rounded-full bg-green-soft" />
        <div aria-hidden className="pointer-events-none absolute top-72 right-[22rem] hidden size-56 rounded-full bg-mustard-soft lg:block" />
        <div className="site-container relative grid items-center gap-16 pt-12 pb-20 lg:grid-cols-[1.1fr_1fr] lg:pt-20 lg:pb-28">
          <div>
            <p className="inline-flex items-center gap-2 rounded-full bg-surface px-3 py-1.5 text-sm font-semibold text-green shadow-card">
              <span className="size-2 rounded-full bg-mustard" /> Launching first at York University
            </p>
            <h1 className="mt-6 font-serif text-5xl leading-[1.04] font-semibold tracking-tight text-balance sm:text-6xl lg:text-7xl">
              Find your people <span className="whitespace-nowrap text-green italic">at York.</span>
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-relaxed text-ink-soft">
              Sidekick is a friends-only app for university students. Swipe through people who share your campus, major and interests, reply to
              whatever catches your eye, and turn it into plans.
            </p>
            <div className="mt-9">
              <WaitlistForm />
            </div>
            <div className="mt-8 flex flex-wrap items-center gap-x-5 gap-y-3">
              <AppStoreBadge />
              <p className="text-sm text-ink-soft">iPhone first · Keele, Glendon and Markham</p>
            </div>
          </div>

          <div className="relative mx-auto w-full max-w-[300px]">
            <PhoneFrame label="Sidekick Discover screen: Maya, 20, Psychology at Keele, shares two of your interests." className="mx-auto">
              <DiscoverScreen profile={MAYA} />
            </PhoneFrame>
            <div
              aria-hidden
              className="absolute top-28 -left-6 hidden animate-float items-center gap-2 rounded-2xl bg-surface px-3.5 py-2.5 text-sm font-semibold shadow-card sm:flex lg:-left-20"
            >
              <span className="size-2.5 rounded-full bg-mustard" /> 2 shared interests
            </div>
            <div
              aria-hidden
              className="absolute top-72 -right-6 hidden animate-float items-center gap-2 rounded-2xl bg-surface px-3.5 py-2.5 text-sm font-semibold shadow-card [animation-delay:-3s] sm:flex lg:-right-20"
            >
              <CommentIcon className="size-4 text-accent" /> Maya replied to your prompt
            </div>
          </div>
        </div>
      </section>

      {/* Trust strip */}
      <section aria-label="Why students trust Sidekick" className="border-y border-line bg-surface">
        <ul className="site-container grid gap-6 py-9 sm:grid-cols-2 lg:grid-cols-4">
          {TRUST.map(({ icon: Icon, title, text }) => (
            <li key={title} className="flex items-start gap-3">
              <span className="grid size-10 shrink-0 place-items-center rounded-2xl bg-green-soft text-green">
                <Icon className="size-5" />
              </span>
              <span>
                <span className="block font-semibold">{title}</span>
                <span className="mt-0.5 block text-sm leading-snug text-ink-soft">{text}</span>
              </span>
            </li>
          ))}
        </ul>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="py-20 sm:py-28">
        <div className="site-container">
          <SectionHeading eyebrow="How it works" title="From York email to weekend plans in three steps." />
          <ol
            aria-label="Three steps"
            tabIndex={0}
            className="-mx-5 mt-12 flex snap-x snap-mandatory gap-6 overflow-x-auto px-5 pb-4 outline-none [scrollbar-width:none] sm:-mx-8 sm:px-8 lg:mx-0 lg:grid lg:grid-cols-3 lg:gap-10 lg:overflow-visible lg:px-0 [&::-webkit-scrollbar]:hidden"
          >
            {STEPS.map((step, i) => (
              <li key={step.title} className="flex w-[80%] max-w-[320px] min-w-[252px] shrink-0 snap-center flex-col items-center text-center sm:w-[46%] lg:w-auto lg:max-w-none">
                <PhoneFrame label={step.label} className="max-w-[270px]">
                  {step.screen}
                </PhoneFrame>
                <span className="mt-8 grid size-10 place-items-center rounded-full bg-accent font-serif text-lg font-semibold text-white">{i + 1}</span>
                <h3 className="mt-4 font-serif text-2xl font-semibold">{step.title}</h3>
                <p className="mt-2 max-w-xs leading-relaxed text-ink-soft">{step.text}</p>
              </li>
            ))}
          </ol>
          <p className="mt-2 text-center text-sm text-ink-soft lg:hidden" aria-hidden>
            Swipe to see all three →
          </p>
        </div>
      </section>

      {/* What makes it different */}
      <section className="overflow-hidden border-t border-line bg-surface py-20 sm:py-28">
        <div className="site-container grid items-center gap-16 lg:grid-cols-[1fr_1.15fr]">
          <div className="relative order-last mx-auto w-full max-w-[300px] lg:order-first">
            <div aria-hidden className="absolute -top-10 -left-16 size-72 rounded-full bg-mustard-soft" />
            <div aria-hidden className="absolute -right-12 -bottom-10 size-56 rounded-full bg-green-soft" />
            <PhoneFrame label="Sidekick Inbox: Jordan, Priya and Liam replied to your prompt, interests and photo." className="mx-auto -rotate-2">
              <InboxScreen />
            </PhoneFrame>
          </div>
          <div>
            <SectionHeading
              eyebrow="Friendship, made easy"
              title={
                <>
                  The swipe you know. <span className="text-green italic">For the friends you need.</span>
                </>
              }
              intro="Dating apps made meeting new people easy. Social networks made it easy to see what you have in common. Sidekick puts both to work on what university is really about: finding your people."
            />
            <ul className="mt-10 grid gap-x-8 gap-y-7 sm:grid-cols-2">
              {FEATURES.map((feature) => (
                <li key={feature.title} className="border-l-2 border-mustard pl-4">
                  <h3 className="font-serif text-xl font-semibold">{feature.title}</h3>
                  <p className="mt-1.5 leading-relaxed text-ink-soft">{feature.text}</p>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* Safety */}
      <section id="safety" className="bg-frame py-20 text-white sm:py-28">
        <div className="site-container">
          <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
            <SectionHeading
              tone="dark"
              eyebrow="Safety"
              title="Your comfort comes first."
              intro="Meeting new people should feel easy, not risky. These protections are on for everyone, from day one."
            />
            <Link href="/safety" className="btn shrink-0 self-start bg-white text-frame hover:bg-green-soft lg:self-auto">
              How we keep you safe <ArrowRightIcon className="size-4" />
            </Link>
          </div>
          <ul className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {SAFETY.map(({ icon: Icon, title, text }) => (
              <li key={title} className="rounded-3xl bg-white/[0.06] p-6 ring-1 ring-white/10">
                <span className="grid size-10 place-items-center rounded-2xl bg-white/10 text-mustard">
                  <Icon className="size-5" />
                </span>
                <h3 className="mt-4 font-serif text-lg font-semibold">{title}</h3>
                <p className="mt-2 text-[15px] leading-relaxed text-white/75">{text}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Campuses */}
      <section id="campuses" className="py-20 sm:py-28">
        <div className="site-container grid gap-12 lg:grid-cols-[1fr_1.2fr] lg:items-center">
          <SectionHeading
            eyebrow="Where we’re launching"
            title={
              <>
                Starting at York. <span className="text-green italic">Your campus next.</span>
              </>
            }
            intro="Sidekick opens first on all three York campuses. Your deck leans toward your own campus, but you can meet students from any of them."
          />
          <ul className="grid gap-4 sm:grid-cols-2">
            {CAMPUSES.map((campus) => (
              <li key={campus.name} className="card flex flex-col gap-3 p-6">
                <span className="flex items-center justify-between">
                  <span className="grid size-10 place-items-center rounded-2xl bg-green-soft text-green">
                    <MapPinIcon className="size-5" />
                  </span>
                  <span className="rounded-full bg-mustard-soft px-2.5 py-1 text-xs font-semibold text-accent-ink">Launching first</span>
                </span>
                <span>
                  <span className="block font-serif text-xl font-semibold">{campus.name}</span>
                  <span className="mt-1 block text-[15px] text-ink-soft">{campus.text}</span>
                </span>
              </li>
            ))}
            <li className="flex flex-col gap-3 rounded-3xl border-2 border-dashed border-line p-6">
              <span className="grid size-10 place-items-center rounded-2xl bg-surface text-ink-soft">
                <PlusIcon className="size-5" />
              </span>
              <span>
                <span className="block font-serif text-xl font-semibold">Somewhere else?</span>
                <span className="mt-1 block text-[15px] text-ink-soft">
                  More campuses come after York. Tell us where you study at {SITE.supportEmail}.
                </span>
              </span>
            </li>
          </ul>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="border-t border-line bg-surface py-20 sm:py-28">
        <div className="site-container grid gap-12 lg:grid-cols-[1fr_1.5fr]">
          <SectionHeading
            eyebrow="FAQ"
            title="Questions, answered."
            intro={
              <>
                Something else on your mind? Visit <Link href="/support" className="font-semibold text-green underline">Support</Link> or email{" "}
                <a href={`mailto:${SITE.supportEmail}`} className="font-semibold text-green underline">
                  {SITE.supportEmail}
                </a>
                .
              </>
            }
          />
          <FaqList items={FAQ} />
        </div>
      </section>

      {/* Closing call to action */}
      <section className="py-20 sm:py-24">
        <div className="site-container">
          <div className="relative overflow-hidden rounded-[2rem] bg-accent px-6 py-14 text-white sm:px-12 sm:py-16">
            <div aria-hidden className="absolute -top-20 -left-16 size-64 rounded-full bg-white/10" />
            <div aria-hidden className="absolute -right-12 -bottom-24 size-72 rounded-full bg-green" />
            <div aria-hidden className="absolute right-40 -bottom-10 hidden size-28 rounded-full bg-mustard sm:block" />
            <div className="relative flex flex-col items-center text-center">
              <h2 className="font-serif text-4xl font-semibold text-balance sm:text-5xl">Your people are out there.</h2>
              <p className="mt-4 max-w-md text-lg text-white/85">Join the waitlist and be first in when Sidekick opens at York.</p>
              <div className="mt-8 flex w-full justify-center">
                <WaitlistForm tone="teal" buttonLabel="Count me in" />
              </div>
              <AppStoreBadge tone="light" className="mt-8" />
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
