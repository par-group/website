import type { Metadata } from "next";
import Link from "next/link";
import { FaqList, type Faq } from "@/components/site/FaqList";
import { MailIcon } from "@/components/ui/icons";
import { SITE } from "@/lib/site";

export const metadata: Metadata = {
  title: "Support",
  description: "Help with the Sidekick waitlist, signing in, blocking, reporting, photos and your account.",
  alternates: { canonical: "/support" },
};

const email = <a href={`mailto:${SITE.supportEmail}`}>{SITE.supportEmail}</a>;

const WAITLIST: Faq[] = [
  {
    question: "How do I know I’m on the waitlist?",
    answer: (
      <p>
        After you join, the page says <strong>You’re on the list</strong>, and we email a confirmation to your York address. It can take a few
        minutes, so check your spam folder too. If you join again with the same email, the page tells you you’re already on the list, and you
        won’t be added twice.
      </p>
    ),
  },
  {
    question: "How do I leave the waitlist?",
    answer: (
      <p>
        Use the link at the bottom of any email we send, including the confirmation, or email {email} from the address you signed up with and
        we’ll remove it.
      </p>
    ),
  },
];

const ACCOUNT: Faq[] = [
  {
    question: "I didn’t get my sign-in code",
    answer: (
      <p>
        Check your spam or junk folder, since the first code sometimes lands there. Make sure you typed your full <strong>@my.yorku.ca</strong>{" "}
        address. Codes expire after 10 minutes. You can ask for a new one after 60 seconds, up to 5 times an hour.
      </p>
    ),
  },
  {
    question: "Why do you need my phone number?",
    answer: (
      <p>
        So people can block you by number, and you can block them, even before anyone joins. Your number is never shown on your profile, and each
        number can only belong to one account.
      </p>
    ),
  },
  {
    question: "How do I block someone?",
    answer: (
      <p>
        Go to <strong>Settings → Block a phone number</strong> and enter their number. You won’t see each other anywhere on Sidekick, even if they
        join later, and they’re never told.
      </p>
    ),
  },
  {
    question: "How do I report someone?",
    answer: (
      <p>
        Email {email} with their first name and what happened. Screenshots help. You can also block them right away. If you’re in immediate danger,
        call 911. More on our <Link href="/safety#report">Safety page</Link>.
      </p>
    ),
  },
  {
    question: "My photo won’t upload",
    answer: <p>Sidekick accepts JPG, PNG, WebP and GIF photos. If a photo won’t upload, save it as a JPG and try again.</p>,
  },
  {
    question: "Can I change my phone number or email?",
    answer: (
      <p>
        To change your number, log out and sign in again with your York email and your new number. Your account stays tied to your York email, so the
        email can’t be changed.
      </p>
    ),
  },
  {
    question: "Who can see my profile?",
    answer: (
      <p>
        Other York students on Sidekick whose filters match yours, except anyone you’ve blocked. Profiles aren’t public on the web and aren’t shown to
        search engines. See our <Link href="/privacy">Privacy Policy</Link> for details.
      </p>
    ),
  },
  {
    question: "How do I take a break or delete my account?",
    answer: (
      <p>
        To take a break, turn off <strong>Account active</strong> in Settings. Your profile is hidden until you turn it back on. To delete your
        account, email {email} from your York address. We’ll delete it within 30 days.
      </p>
    ),
  },
];

export default function SupportPage() {
  return (
    <div className="site-container py-16 sm:py-20">
      <div className="mx-auto max-w-3xl">
        <p className="eyebrow text-green">Support</p>
        <h1 className="mt-3 font-serif text-4xl font-semibold sm:text-5xl">How can we help?</h1>
        <div className="card mt-8 flex flex-col gap-4 p-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex gap-4">
            <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-green-soft text-green">
              <MailIcon className="size-5" />
            </span>
            <div>
              <h2 className="font-serif text-xl font-semibold">Email us</h2>
              <p className="mt-1 text-ink-soft">We read every message. Write from your York email if it’s about your account.</p>
            </div>
          </div>
          <a href={`mailto:${SITE.supportEmail}`} className="btn-primary shrink-0">
            {SITE.supportEmail}
          </a>
        </div>

        <h2 className="mt-14 font-serif text-2xl font-semibold">The waitlist</h2>
        <div className="mt-5">
          <FaqList items={WAITLIST} />
        </div>

        <h2 className="mt-14 font-serif text-2xl font-semibold">Using Sidekick</h2>
        <div className="mt-5">
          <FaqList items={ACCOUNT} />
        </div>

        <p className="mt-14 rounded-3xl bg-green-soft p-5 leading-relaxed text-ink">
          Worried about someone’s behaviour, or need help right now? Our <Link href="/safety" className="font-semibold text-green underline">Safety page</Link>{" "}
          explains how to block and report, and lists support you can reach 24/7.
        </p>
      </div>
    </div>
  );
}
