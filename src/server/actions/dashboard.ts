"use server";

import { requireDashboardAccess } from "@/server/dashboard-auth";
import { checkEmailLogin } from "@/server/mailer";
import { removeSignupById } from "@/server/waitlist";

// The dashboard's buttons. Server Actions are public endpoints, so each checks
// the dashboard password itself, on top of proxy.ts.

export type ActionResult = { ok: boolean; detail: string };

/** Setup's "Test connection": signs in to the email provider, sending nothing. */
export async function testEmailConnection(): Promise<ActionResult> {
  await requireDashboardAccess();
  return checkEmailLogin();
}

/** The waitlist list's "Remove", e.g. for test signups. */
export async function removeSignup(id: unknown): Promise<ActionResult> {
  await requireDashboardAccess();
  if (typeof id !== "string" || !id) return { ok: false, detail: "Missing signup." };
  return (await removeSignupById(id)) ? { ok: true, detail: "Removed." } : { ok: false, detail: "Already removed." };
}
