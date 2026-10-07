"use server";

import crypto from "node:crypto";
import { redirect } from "next/navigation";
import { after } from "next/server";
import { cleanPlatform, cleanSchool, cleanSource, isStudentEmail, isValidEmail, normalizeEmail, schoolForEmail, STUDENTS_ONLY } from "@/lib/waitlist";
import { emailProvider } from "@/server/mailer";
import { addSignup, removeSignupByToken, saveSignupDetails } from "@/server/waitlist";
import { sendWaitlistConfirmation } from "@/server/waitlist-email";

// Server Actions are public endpoints: every argument is re-checked here,
// whatever the form already validated.

/** `alreadyJoined`: the email was on the list before, so the page says so (and nothing is emailed). */
export type JoinResult = { ok: true; id: string; school: string | null; alreadyJoined: boolean } | { ok: false; error: string };
export type DetailsResult = { ok: true } | { ok: false; error: string };

const SAVE_FAILED = "We couldn’t save that just now. Please try again in a minute.";
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

export async function joinWaitlist(input: { email?: unknown; source?: unknown; website?: unknown }): Promise<JoinResult> {
  const email = typeof input?.email === "string" ? normalizeEmail(input.email) : "";
  if (!isValidEmail(email)) return { ok: false, error: "Enter a valid email address, like yourname@my.yorku.ca." };
  if (!isStudentEmail(email)) return { ok: false, error: STUDENTS_ONLY };

  // Honeypot: a field people never see. Bots that fill it get a normal-looking
  // success, and nothing is stored.
  if (typeof input.website === "string" && input.website.trim()) {
    return { ok: true, id: crypto.randomUUID(), school: schoolForEmail(email), alreadyJoined: false };
  }

  try {
    const { id, created, removalToken } = await addSignup(email, cleanSource(input.source));
    // Only a new signup is emailed, so the form can't be used to flood someone's inbox.
    // It's sent after the response, so joining stays instant.
    if (created && removalToken && emailProvider()) after(() => sendWaitlistConfirmation({ id, email }, removalToken));
    return { ok: true, id, school: schoolForEmail(email), alreadyJoined: !created };
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

/**
 * "Not you? Remove it": the button on the page the confirmation email links to.
 * Opening the link never deletes anything (mail scanners open links); this does.
 * A link that's already been used ends up on the same "removed" page.
 */
export async function removeFromWaitlist(formData: FormData): Promise<never> {
  const token = formData.get("token");
  await removeSignupByToken(typeof token === "string" ? token : "");
  redirect("/waitlist/removed");
}
