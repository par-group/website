import type { Metadata } from "next";
import Link from "next/link";
import { LegalDocument } from "@/components/site/LegalDocument";
import { SITE } from "@/lib/site";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "What Sidekick collects on its website, waitlist and app, who can see it, and how to control or delete it.",
  alternates: { canonical: "/privacy" },
};

// TODO(launch): have the policy reviewed by someone qualified (PIPEDA, CASL,
// Ontario law), keep it in sync with the app's copy, and update
// LEGAL_LAST_UPDATED in src/lib/site.ts on every change.
export default function PrivacyPage() {
  const email = <a href={`mailto:${SITE.supportEmail}`}>{SITE.supportEmail}</a>;
  return (
    <LegalDocument
      title="Privacy Policy"
      summary="We collect what Sidekick needs to tell you when it launches, to verify you’re a York student, and to introduce you to other students. We don’t sell your information, show ads or use third-party tracking. Your email, phone number and birth date are never shown on your profile."
    >
      <h2>Who we are</h2>
      <p>
        Sidekick (“we”, “us”) runs the website at {SITE.displayUrl}, its waitlist, and the Sidekick apps, including the web version. Questions about
        this policy or your information go to {email}.
      </p>

      <h2>The website and waitlist</h2>
      <p>If you join the waitlist, we collect:</p>
      <ul>
        <li>
          <strong>Your York email address</strong> (@my.yorku.ca), to confirm you joined and tell you when Sidekick launches.
        </li>
        <li>
          <strong>Your answer to the optional question</strong>: which phone you use. It helps us decide which app to build first.
        </li>
        <li>
          <strong>How you found us</strong>, such as the link on a poster or the site that sent you, and when you signed up. It’s a short label, not
          your browsing history.
        </li>
      </ul>
      <p>
        When you join, we send one email to confirm it, with a link to remove your address if it wasn’t you. After that we only email waitlist
        members about Sidekick’s launch, and every email has a link to leave the list. The website doesn’t use advertising or
        analytics cookies. It keeps the “how you found us” label in your browser until you close the tab, so it isn’t lost if you look around
        before signing up.
      </p>

      <h2>What the app collects</h2>
      <ul>
        <li>
          <strong>Sign-in details:</strong> your York email address and your phone number. We send a one-time code to your email to confirm it’s
          yours. Codes are stored only in scrambled (hashed) form and expire after 10 minutes.
        </li>
        <li>
          <strong>Your profile:</strong> your name, birth date, gender, main campus, major, degree, hometown and living situation (including your
          residence building, if you choose to add it), plus your photos, interests, prompt answers and the people you want to see.
        </li>
        <li>
          <strong>What you do on Sidekick:</strong> who you tap Friend or pass on, your matches, comments and messages, and the phone numbers you
          block. Blocked numbers are stored only as a keyed hash, never as the number itself.
        </li>
        <li>
          <strong>Technical details:</strong> a sign-in cookie that keeps you logged in for up to 30 days, and the standard logs (such as IP address
          and browser type) that our hosting provider keeps to run and protect the service.
        </li>
      </ul>

      <h2>How we use it</h2>
      <ul>
        <li>To tell waitlist members when Sidekick launches, and to plan where to launch next.</li>
        <li>To confirm you’re a York student and keep one account per person and per phone number.</li>
        <li>To show you people you might get along with and to show your profile to them.</li>
        <li>To deliver your comments and messages, and to enforce blocks, filters and our Terms.</li>
        <li>To keep Sidekick secure, investigate reports, and fix problems.</li>
      </ul>
      <p>We don’t sell or rent your information, we don’t show ads, and we don’t use third-party analytics or advertising trackers.</p>

      <h2>Who can see what</h2>
      <ul>
        <li>
          <strong>Waitlist details</strong> are seen only by the people who run Sidekick.
        </li>
        <li>
          <strong>Other Sidekick users</strong> who are shown your profile see your first name, age, photos, campus, major and degree, hometown,
          interests, custom tag and prompt answers. Your residence building is shown only to people who also live in residence.
        </li>
        <li>
          <strong>Never shown:</strong> your email address, phone number, birth date and gender. Gender is used only for the “same gender” filter.
        </li>
        <li>
          <strong>People you block</strong> by phone number can’t see you, and you can’t see them. Nobody is told they’ve been blocked.
        </li>
        <li>
          <strong>Photos</strong> can only be opened by people signed in to Sidekick. Profiles aren’t shown to search engines.
        </li>
      </ul>

      <h2>Service providers</h2>
      <p>
        We use a small number of providers to run Sidekick: Vercel (website hosting and photo storage), Turso (database, including the waitlist) and
        Zoho (sending email). If we use an email service to send the launch announcement, we share waitlist email addresses with it for that
        purpose only. Providers process information only on our behalf. Your information may be stored and processed in Canada and the United
        States.
      </p>

      <h2>How long we keep it</h2>
      <p>
        <strong>Waitlist:</strong> until you remove yourself or ask us to, and no longer than we need it to tell you about Sidekick’s launch.
        Removing yourself deletes your signup.
      </p>
      <p>
        <strong>Accounts:</strong> while your account exists. If you deactivate your account in Settings, your profile is hidden but saved so you
        can come back. To delete your account, email {email} from your York address. We’ll delete your account and the information connected to
        it, including your photos and messages, within 30 days, unless we need to keep something to meet a legal obligation or resolve a safety
        report.
      </p>

      <h2>Your choices and rights</h2>
      <ul>
        <li>You can leave the waitlist at any time, using the link in any email we send or by writing to us.</li>
        <li>You can view and edit your profile at any time, and change who you see in Settings.</li>
        <li>You can ask us for a copy of your information, ask us to correct it, or ask us to delete it.</li>
        <li>You can withdraw your consent by leaving the waitlist or deleting your account.</li>
      </ul>
      <p>
        If you’re not satisfied with our response, you can contact the{" "}
        <a href="https://www.priv.gc.ca" rel="noreferrer">
          Office of the Privacy Commissioner of Canada
        </a>
        .
      </p>

      <h2>Security</h2>
      <p>
        Sidekick is served over HTTPS. Sign-in codes and blocked numbers are stored as hashes, sign-in cookies are signed, and access to our systems
        is limited to the people who run Sidekick. No system is perfectly secure, so please use a unique password for your York email.
      </p>

      <h2>Age</h2>
      <p>Sidekick is for people 18 and older. We don’t knowingly collect information from anyone younger.</p>

      <h2>Changes</h2>
      <p>
        If we change this policy, we’ll update the date at the top of this page, and tell you in the app for significant changes. See also our{" "}
        <Link href="/terms">Terms of Use</Link>.
      </p>
    </LegalDocument>
  );
}
