import type { Metadata } from "next";
import Link from "next/link";
import { LegalDocument } from "@/components/site/LegalDocument";
import { SITE } from "@/lib/site";

export const metadata: Metadata = {
  title: "Terms of Use",
  description: "The rules for using Sidekick, the friends-only app for university students, and its waitlist.",
  alternates: { canonical: "/terms" },
};

// TODO(launch): have the Terms reviewed by someone qualified, keep them in sync
// with the app's copy, and update LEGAL_LAST_UPDATED in src/lib/site.ts on every change.
export default function TermsPage() {
  const email = <a href={`mailto:${SITE.supportEmail}`}>{SITE.supportEmail}</a>;
  return (
    <LegalDocument
      title="Terms of Use"
      summary="Sidekick is for York students who are 18 or older and looking for friends. Be kind, be yourself, and respect other people’s boundaries. If someone makes you uncomfortable, block them and tell us."
    >
      <h2>Using Sidekick</h2>
      <p>
        By joining the waitlist, creating an account or using Sidekick, you agree to these Terms and to our <Link href="/privacy">Privacy Policy</Link>.
        To use the Sidekick app you must:
      </p>
      <ul>
        <li>be at least 18 years old;</li>
        <li>be a current York University student with a working @my.yorku.ca email address;</li>
        <li>use your real name and your own photos, and keep one account only;</li>
        <li>keep access to your York email secure, since it’s how you sign in.</li>
      </ul>

      <h2>The website and waitlist</h2>
      <p>
        York students can join the waitlist on {SITE.displayUrl} with their @my.yorku.ca email. Joining doesn’t create a Sidekick account or
        guarantee access. It means we’ll confirm your signup by email and tell you about Sidekick’s launch, as described in our{" "}
        <Link href="/privacy">Privacy Policy</Link>. You can leave the waitlist at any time.
      </p>

      <h2>Friends, not dates</h2>
      <p>
        Sidekick is for making friends. Don’t use it for dating or hookups, or to sell, recruit, promote or fundraise, including for businesses,
        clubs or events, unless we’ve agreed to it in writing.
      </p>

      <h2>Community rules</h2>
      <p>
        You agree not to (see also our <Link href="/safety#community-guidelines">community guidelines</Link>):
      </p>
      <ul>
        <li>harass, bully, threaten, stalk or intimidate anyone, on or off Sidekick;</li>
        <li>post hateful, sexual, violent or graphic content, or content that sexualizes anyone;</li>
        <li>pretend to be someone else, create fake accounts, or post photos of other people without their permission;</li>
        <li>share anyone’s private information, including screenshots of their profile or messages, without their consent;</li>
        <li>send spam or scams, or ask people for money;</li>
        <li>break the law, or help anyone else break these rules;</li>
        <li>scrape, copy, disrupt or try to get unauthorized access to Sidekick or other people’s accounts.</li>
      </ul>

      <h2>Your content</h2>
      <p>
        You own the photos, answers, comments and messages you post. You give us permission to store, display and process them in order to run
        Sidekick, for example to show your profile to other students and to deliver your messages. This permission ends when you delete your content
        or your account, except for copies we need to keep for safety or legal reasons. Only post content you have the right to share.
      </p>

      <h2>Safety</h2>
      <p>
        We don’t run background checks, and we can’t guarantee how anyone will behave. Meet new friends in public places, tell someone where you’re
        going, and trust your instincts. You can block anyone by their phone number in Settings. To report someone, email {email} with their first
        name and what happened. If you’re ever in immediate danger, call 911.
      </p>

      <h2>Suspending or ending accounts</h2>
      <p>
        We may remove content, or suspend or close accounts, that break these Terms or put others at risk. You can deactivate your account in
        Settings at any time, or ask us to delete it by emailing {email}.
      </p>

      <h2>Sidekick is new</h2>
      <p>
        We’re improving Sidekick all the time, so features may change, pause or stop. Sidekick is provided “as is”. We don’t promise that it will
        always be available or error-free, or that you’ll find friends on it.
      </p>

      <h2>Liability</h2>
      <p>
        To the extent the law allows, Sidekick isn’t responsible for the actions of its users, on or off the app, or for indirect or consequential
        losses. Nothing in these Terms limits rights you have under law that can’t be limited.
      </p>

      <h2>Independence from York University</h2>
      <p>Sidekick is independent. It isn’t operated, affiliated with, or endorsed by York University.</p>

      <h2>Changes and contact</h2>
      <p>
        If we change these Terms, we’ll update the date at the top of this page, and tell you in the app for significant changes. Continuing to use
        Sidekick after a change means you accept it. These Terms are governed by the laws of Ontario and the federal laws of Canada that apply there.
        Questions? Email {email}.
      </p>
    </LegalDocument>
  );
}
