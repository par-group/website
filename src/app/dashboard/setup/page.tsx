import type { Metadata } from "next";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { TIME_ZONE } from "@/lib/calendar";
import { SITE } from "@/lib/site";
import { requireDashboardAccess } from "@/server/dashboard-auth";
import { senderAddress } from "@/server/mailer";
import { deployment, systemStatus } from "@/server/status";

export const metadata: Metadata = { title: "Setup" };

type State = "ok" | "off" | "waiting" | "problem";
type Check = { name: string; state: State; detail: string; next?: string };

// Status always comes with an icon and a word, never colour alone.
const STATES: Record<State, { icon: string; label: string; className: string }> = {
  ok: { icon: "✓", label: "Working", className: "bg-green-soft text-green" },
  off: { icon: "–", label: "Off", className: "bg-bg text-ink-soft" },
  waiting: { icon: "…", label: "Not set up yet", className: "bg-mustard-soft text-accent-ink" },
  problem: { icon: "!", label: "Needs attention", className: "bg-danger/10 text-danger" },
};

const ENVIRONMENTS: Record<string, string> = {
  production: "Production",
  preview: "Preview",
  development: "Development",
  local: "Local (not on Vercel)",
};

export default async function SetupPage() {
  await requireDashboardAccess();
  const { configured, database, appDatabase, checkedAt } = await systemStatus();
  const deploy = deployment();
  const checked = new Intl.DateTimeFormat("en-CA", { timeZone: TIME_ZONE, dateStyle: "medium", timeStyle: "medium" }).format(checkedAt);

  const checks: Check[] = [
    database.ok
      ? { name: "Waitlist database", state: "ok", detail: `Signups are being saved: ${configured.database}.` }
      : {
          name: "Waitlist database",
          state: "problem",
          detail: database.detail,
          next: "Signups can’t be saved. Check TURSO_DATABASE_URL and TURSO_AUTH_TOKEN in Vercel (deployment guide, step 2).",
        },
    configured.confirmationEmails
      ? {
          name: "Confirmation emails",
          state: "ok",
          detail: `New signups get a confirmation from ${senderAddress()} (${configured.confirmationEmails === "smtp" ? "SMTP" : "Resend"}).`,
        }
      : {
          name: "Confirmation emails",
          state: "waiting",
          detail: "Signups are saved, but no confirmation email is sent.",
          next: "Set SMTP_HOST, SMTP_USER and SMTP_PASS in Vercel (the app’s mailbox settings) and redeploy (deployment guide, step 8).",
        },
    appDatabase.ok
      ? { name: "App data", state: "ok", detail: `Reading the app’s tables (${appDatabase.detail}).` }
      : appDatabase.detail.startsWith("no app tables yet")
        ? {
            name: "App data",
            state: "waiting",
            detail: "The app hasn’t run on its database yet, so the Overview shows waitlist numbers only.",
            next: "Nothing to do: when the app launches on the waitlist’s database, its numbers appear.",
          }
        : {
            name: "App data",
            state: "problem",
            detail: appDatabase.detail,
            next: "Check APP_DATABASE_URL and APP_DATABASE_AUTH_TOKEN (deployment guide, step 7).",
          },
    { name: "Dashboard password", state: "ok", detail: "Set. Anyone with it can see every signup, so keep it private." },
    configured.iosAppLinks
      ? { name: "iPhone app links", state: "ok", detail: "Invite links open the iPhone app when it’s installed." }
      : {
          name: "iPhone app links",
          state: "waiting",
          detail: "Invite links open the website for now.",
          next: "When the iPhone app exists, set APPLE_APP_IDS (deployment guide, step 6).",
        },
    configured.androidAppLinks
      ? { name: "Android app links", state: "ok", detail: "Invite links open the Android app when it’s installed." }
      : {
          name: "Android app links",
          state: "waiting",
          detail: "Invite links open the website for now.",
          next: "When the Android app exists, set ANDROID_PACKAGE_NAME and ANDROID_CERT_SHA256 (deployment guide, step 6).",
        },
    SITE.appStoreUrl
      ? { name: "App Store listing", state: "ok", detail: `The site links to ${SITE.appStoreUrl}.` }
      : {
          name: "App Store listing",
          state: "waiting",
          detail: "The site shows “Coming soon”.",
          next: "On launch day, set APP_STORE_ID in src/lib/site.ts.",
        },
    configured.waitlistExport
      ? { name: "Waitlist export link", state: "ok", detail: "/api/waitlist/export downloads the waitlist with its own password." }
      : { name: "Waitlist export link", state: "off", detail: "Not needed: the Waitlist tab has a download." },
    configured.appDemoRewrite
      ? { name: "Web version of the app", state: "ok", detail: "Served at /app-demo." }
      : { name: "Web version of the app", state: "off", detail: "Not served (/app-demo is off)." },
  ];
  const problems = checks.filter((c) => c.state === "problem").length;

  return (
    <>
      <PageHeader
        title="Setup"
        actions={
          <a href="/api/health" className="btn-secondary">
            Raw health check
          </a>
        }
      >
        Whether each part of Sidekick’s website is connected and working, checked just now ({checked}).
      </PageHeader>

      <p
        role="status"
        className={`mt-6 rounded-2xl px-5 py-3 text-sm font-semibold ${problems ? "bg-danger/10 text-danger" : "bg-green-soft text-green"}`}
      >
        {problems ? `${problems} ${problems === 1 ? "thing needs" : "things need"} attention.` : "✓ Everything that’s set up is working."}
      </p>

      <ul className="card mt-5 divide-y divide-line/70">
        {checks.map((check) => {
          const state = STATES[check.state];
          return (
            <li key={check.name} className="flex flex-col gap-2 px-6 py-4 sm:flex-row sm:items-start sm:gap-6">
              <div className="flex items-center gap-3 sm:w-64 sm:shrink-0">
                <span aria-hidden className={`grid size-7 shrink-0 place-items-center rounded-full text-sm font-bold ${state.className}`}>
                  {state.icon}
                </span>
                <span className="font-semibold">{check.name}</span>
              </div>
              <div className="min-w-0 flex-1 text-sm">
                <p>
                  <span className={`mr-2 inline-block rounded-full px-2 py-0.5 text-xs font-semibold ${state.className}`}>{state.label}</span>
                  <span className="[overflow-wrap:anywhere] text-ink-soft">{check.detail}</span>
                </p>
                {check.next && <p className="mt-1.5 text-ink">{check.next}</p>}
              </div>
            </li>
          );
        })}
      </ul>

      <section aria-labelledby="deployment" className="card mt-5 p-6">
        <h2 id="deployment" className="font-semibold">
          Running version
        </h2>
        <dl className="mt-4 grid gap-x-8 gap-y-3 text-sm sm:grid-cols-[10rem_1fr]">
          <dt className="text-ink-soft">Environment</dt>
          <dd>{ENVIRONMENTS[deploy.environment] ?? deploy.environment}</dd>
          <dt className="text-ink-soft">Version</dt>
          <dd className="[overflow-wrap:anywhere]">
            {deploy.commit ? (
              <>
                {deploy.repo ? (
                  <a
                    href={`https://github.com/${deploy.repo}/commit/${deploy.commit}`}
                    className="font-mono font-semibold text-green hover:underline"
                  >
                    {deploy.commit.slice(0, 7)}
                  </a>
                ) : (
                  <span className="font-mono">{deploy.commit.slice(0, 7)}</span>
                )}
                {deploy.message && <span className="text-ink-soft"> · {deploy.message.split("\n")[0]}</span>}
              </>
            ) : (
              <span className="text-ink-soft">Not deployed from Git</span>
            )}
          </dd>
          {deploy.region && (
            <>
              <dt className="text-ink-soft">Server region</dt>
              <dd>{deploy.region}</dd>
            </>
          )}
          <dt className="text-ink-soft">Site address</dt>
          <dd>{SITE.url}</dd>
        </dl>
      </section>
    </>
  );
}
