import "server-only";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { DASHBOARD_REALM, hasPassword, passwordRequired } from "@/server/basic-auth";

// The dashboard is behind DASHBOARD_PASSWORD (any username). proxy.ts asks for
// it on every /dashboard request; these check it again where the data is read,
// and hide the dashboard (404) when no password is set. (proxy.ts uses
// basic-auth.ts directly: this module needs the page/route runtime.)

/** For dashboard pages and layouts. Reading the request first keeps them per-request, so none is built as a fixed 404. */
export async function requireDashboardAccess(): Promise<void> {
  const authorization = (await headers()).get("authorization");
  const password = process.env.DASHBOARD_PASSWORD;
  if (!password || !hasPassword(authorization, password)) notFound();
}

/** For dashboard route handlers (downloads): the response to send instead, or null to go ahead. */
export function dashboardRequestDenied(request: Request): Response | null {
  const password = process.env.DASHBOARD_PASSWORD;
  if (!password) return new Response("Not found", { status: 404 });
  return hasPassword(request.headers.get("authorization"), password) ? null : passwordRequired(DASHBOARD_REALM);
}
