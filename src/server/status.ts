import "server-only";
import { appDb } from "@/server/app-db";
import { androidApp, appleAppIds } from "@/server/app-links";
import { db, IS_HOSTED_DB } from "@/server/db";

// The deployment's state: which settings are present (never their values) and
// whether the databases answer. /api/health reports it publicly; the dashboard's
// Setup page explains it, with the deployment details only the owner should see.

export type Probe = { ok: boolean; detail: string };

async function probe(check: () => Promise<Probe>): Promise<Probe> {
  try {
    return await check();
  } catch (e) {
    return { ok: false, detail: e instanceof Error ? e.message : String(e) };
  }
}

export async function systemStatus() {
  const configured = {
    database: IS_HOSTED_DB ? "hosted (TURSO_DATABASE_URL set)" : "local file (no TURSO_DATABASE_URL)",
    databaseAuthToken: !!process.env.TURSO_AUTH_TOKEN,
    waitlistExport: !!process.env.WAITLIST_EXPORT_PASSWORD,
    appDemoRewrite: !!process.env.APP_DEMO_ORIGIN,
    iosAppLinks: appleAppIds().length > 0,
    androidAppLinks: !!androidApp(),
    dashboard: !!process.env.DASHBOARD_PASSWORD,
    onVercel: !!process.env.VERCEL,
  };
  const [database, appDatabase] = await Promise.all([
    probe(async () => {
      await (await db()).execute("SELECT 1 FROM waitlist_signups LIMIT 1");
      return { ok: true, detail: "connected" };
    }),
    // For the dashboard: how the app's data is reached, and whether the app's tables are there yet.
    probe(async () => {
      const app = await appDb();
      return { ok: app.ready, detail: app.ready ? app.via : `no app tables yet (${app.via})` };
    }),
  ]);
  return { configured, database, appDatabase, checkedAt: Date.now() };
}

/** The running deployment, from Vercel's system environment variables (none when run locally). */
export function deployment() {
  const env = process.env;
  return {
    environment: env.VERCEL_ENV ?? "local",
    commit: env.VERCEL_GIT_COMMIT_SHA ?? null,
    message: env.VERCEL_GIT_COMMIT_MESSAGE ?? null,
    repo: env.VERCEL_GIT_REPO_OWNER && env.VERCEL_GIT_REPO_SLUG ? `${env.VERCEL_GIT_REPO_OWNER}/${env.VERCEL_GIT_REPO_SLUG}` : null,
    region: env.VERCEL_REGION ?? null,
  };
}
