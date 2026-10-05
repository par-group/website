import { systemStatus } from "@/server/status";

/**
 * Deployment self-check: which services are configured, and can the waitlist
 * database be reached? Reports presence only, never values or signup counts.
 * The dashboard's Setup page shows the same, explained.
 */
export async function GET() {
  const { configured, database, appDatabase } = await systemStatus();
  return Response.json(
    { ok: database.ok, configured, database, appDatabase },
    { status: database.ok ? 200 : 503, headers: { "Cache-Control": "no-store" } },
  );
}
