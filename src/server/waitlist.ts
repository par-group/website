import "server-only";
import crypto from "node:crypto";
import { all, run } from "@/server/db";
import { schoolForEmail, type Platform } from "@/lib/waitlist";

export type WaitlistSignup = {
  id: string;
  email: string;
  school: string | null;
  platform: Platform | null;
  source: string | null;
  created_at: number;
  updated_at: number;
};

/**
 * Adds an email to the waitlist, or finds it if it's already there. Signing up
 * twice is not an error, so the form never reveals who is on the list. The first
 * signup's source is kept. Returns the row id, which the follow-up questions use.
 */
export async function addSignup(email: string, source: string | null, now = Date.now()): Promise<string> {
  const [row] = await all<{ id: string }>(
    `INSERT INTO waitlist_signups (id, email, school, source, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?)
     ON CONFLICT(email) DO UPDATE SET updated_at = excluded.updated_at
     RETURNING id`,
    [crypto.randomUUID(), email, schoolForEmail(email), source, now, now],
  );
  return row.id;
}

/** Saves the optional follow-up answers. Unanswered questions keep their earlier value. */
export async function saveSignupDetails(id: string, details: { school: string | null; platform: Platform | null }, now = Date.now()) {
  const { changes } = await run(
    `UPDATE waitlist_signups
     SET school = COALESCE(?, school), platform = COALESCE(?, platform), updated_at = ?
     WHERE id = ?`,
    [details.school, details.platform, now, id],
  );
  return changes > 0;
}

/** Everyone on the list, oldest first (for the CSV export). */
export function listSignups(): Promise<WaitlistSignup[]> {
  return all<WaitlistSignup>("SELECT * FROM waitlist_signups ORDER BY created_at, email");
}
