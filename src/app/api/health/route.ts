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
    onVercel: !!process.env.VERCEL,
  };

  let database: { ok: boolean; detail: string };
  try {
    await (await db()).execute("SELECT 1 FROM waitlist_signups LIMIT 1");
    database = { ok: true, detail: "connected" };
  } catch (e) {
    database = { ok: false, detail: e instanceof Error ? e.message : String(e) };
  }

  return Response.json({ ok: database.ok, configured, database }, { status: database.ok ? 200 : 503, headers: { "Cache-Control": "no-store" } });
}
