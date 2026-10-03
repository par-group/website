import { appDb } from "@/server/app-db";
import { androidApp, appleAppIds } from "@/server/app-links";
import { db, IS_HOSTED_DB } from "@/server/db";

/**
 * Deployment self-check: which services are configured, and can the waitlist
 * database be reached? Reports presence only, never values or signup counts.
 */
export async function GET() {
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

  let database: { ok: boolean; detail: string };
  try {
    await (await db()).execute("SELECT 1 FROM waitlist_signups LIMIT 1");
    database = { ok: true, detail: "connected" };
  } catch (e) {
    database = { ok: false, detail: e instanceof Error ? e.message : String(e) };
  }

  // The app's database, for the dashboard: how it's connected, and whether the app's tables are there yet.
  let appDatabase: { ok: boolean; detail: string };
  try {
    const app = await appDb();
    appDatabase = { ok: app.ready, detail: app.ready ? app.via : `no app tables yet (${app.via})` };
  } catch (e) {
    appDatabase = { ok: false, detail: e instanceof Error ? e.message : String(e) };
  }

  return Response.json({ ok: database.ok, configured, database, appDatabase }, { status: database.ok ? 200 : 503, headers: { "Cache-Control": "no-store" } });
}
