"use server";

import crypto from "node:crypto";
import { cleanPlatform, cleanSchool, cleanSource, isValidEmail, normalizeEmail, schoolForEmail } from "@/lib/waitlist";
import { addSignup, saveSignupDetails } from "@/server/waitlist";

// Server Actions are public endpoints: every argument is re-checked here,
// whatever the form already validated.

export type JoinResult = { ok: true; id: string; school: string | null } | { ok: false; error: string };
export type DetailsResult = { ok: true } | { ok: false; error: string };

const SAVE_FAILED = "We couldn’t save that just now. Please try again in a minute.";
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

export async function joinWaitlist(input: { email?: unknown; source?: unknown; website?: unknown }): Promise<JoinResult> {
  const email = typeof input?.email === "string" ? normalizeEmail(input.email) : "";
  if (!isValidEmail(email)) return { ok: false, error: "Enter a valid email address, like yourname@my.yorku.ca." };

  // Honeypot: a field people never see. Bots that fill it get a normal-looking
  // success, and nothing is stored.
  if (typeof input.website === "string" && input.website.trim()) {
    return { ok: true, id: crypto.randomUUID(), school: schoolForEmail(email) };
  }

  try {
    const id = await addSignup(email, cleanSource(input.source));
    return { ok: true, id, school: schoolForEmail(email) };
  } catch (e) {
    console.error("waitlist: signup failed", e);
    return { ok: false, error: SAVE_FAILED };
  }
}

export async function saveWaitlistDetails(input: { id?: unknown; school?: unknown; platform?: unknown }): Promise<DetailsResult> {
  const id = typeof input?.id === "string" ? input.id : "";
  if (!UUID.test(id)) return { ok: false, error: "Something went wrong. Refresh the page and try again." };

  const details = { school: cleanSchool(input.school), platform: cleanPlatform(input.platform) };
  if (!details.school && !details.platform) return { ok: true };

  try {
    // A row that doesn't exist (e.g. a honeypot id) is ignored, not reported.
    await saveSignupDetails(id, details);
    return { ok: true };
  } catch (e) {
    console.error("waitlist: saving details failed", e);
    return { ok: false, error: SAVE_FAILED };
  }
}
