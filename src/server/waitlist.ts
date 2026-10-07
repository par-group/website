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
  confirmation_sent_at: number | null;
  created_at: number;
  updated_at: number;
};

const COLUMNS = "id, email, school, platform, source, confirmation_sent_at, created_at, updated_at";

/**
 * The token in a signup's "not you? remove it" link: random, and only its hash
 * is stored, so the database alone can't be used to remove anyone.
 */
const TOKEN = /^[A-Za-z0-9_-]{32}$/;
const hashToken = (token: string) => crypto.createHash("sha256").update(token).digest("hex");

/**
 * Adds an email to the waitlist, or finds it if it's already there. Signing up
 * twice is not an error, so the form never reveals who is on the list. The first
 * signup's source is kept. Returns the row id, which the follow-up question uses,
 * and for a new signup the removal token for its confirmation email.
 */
export async function addSignup(
  email: string,
  source: string | null,
  now = Date.now(),
): Promise<{ id: string; created: boolean; removalToken: string | null }> {
  const id = crypto.randomUUID();
  const removalToken = crypto.randomBytes(24).toString("base64url");
  const [row] = await all<{ id: string }>(
    `INSERT INTO waitlist_signups (id, email, school, source, removal_token_hash, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)
     ON CONFLICT(email) DO UPDATE SET updated_at = excluded.updated_at
     RETURNING id`,
    [id, email, schoolForEmail(email), source, hashToken(removalToken), now, now],
  );
  const created = row.id === id;
  return { id: row.id, created, removalToken: created ? removalToken : null };
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

/** Records that the confirmation email was accepted for delivery. */
export async function markConfirmationSent(id: string, now = Date.now()) {
  await run("UPDATE waitlist_signups SET confirmation_sent_at = ? WHERE id = ?", [now, id]);
}

/** The signup a removal link belongs to, or null if the link is malformed, used or unknown. */
export async function findSignupByRemovalToken(token: string): Promise<{ id: string; email: string } | null> {
  if (!TOKEN.test(token)) return null;
  const [row] = await all<{ id: string; email: string }>("SELECT id, email FROM waitlist_signups WHERE removal_token_hash = ?", [hashToken(token)]);
  return row ?? null;
}

/** Deletes the signup a removal link belongs to. False if there was none (already removed, or not a real link). */
export async function removeSignupByToken(token: string): Promise<boolean> {
  if (!TOKEN.test(token)) return false;
  const { changes } = await run("DELETE FROM waitlist_signups WHERE removal_token_hash = ?", [hashToken(token)]);
  return changes > 0;
}

/** Everyone on the list, oldest first (for the CSV export). */
export function listSignups(): Promise<WaitlistSignup[]> {
  return all<WaitlistSignup>(`SELECT ${COLUMNS} FROM waitlist_signups ORDER BY created_at, email`);
}
