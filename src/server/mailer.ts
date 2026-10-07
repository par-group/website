import "server-only";
import { createTransport } from "nodemailer";

// Outgoing email, with the same settings as the app (app-demo/src/server/mailer.ts),
// so one mailbox serves both. Two providers, first configured one wins:
//  1. SMTP, e.g. Zoho Mail on our domain: SMTP_HOST, SMTP_USER, SMTP_PASS
//     [, SMTP_PORT=465, SMTP_SECURE, EMAIL_FROM]. SMTP_HOST can be left out for @gmail.com.
//  2. Resend (needs a verified domain): RESEND_API_KEY, EMAIL_FROM.

export type OutgoingEmail = {
  to: string;
  subject: string;
  text: string;
  html: string;
  /** Lets providers drop accidental duplicates of the same message. */
  idempotencyKey: string;
  headers?: Record<string, string>;
};
export type EmailProvider = "smtp" | "resend";

/** Gmail is the only server we can infer; every other provider must name its SMTP_HOST. */
function smtpHost(): string | null {
  if (process.env.SMTP_HOST) return process.env.SMTP_HOST;
  return process.env.SMTP_USER?.trim().toLowerCase().endsWith("@gmail.com") ? "smtp.gmail.com" : null;
}

export function emailProvider(): EmailProvider | null {
  if (process.env.SMTP_USER && process.env.SMTP_PASS && smtpHost()) return "smtp";
  if (process.env.RESEND_API_KEY && process.env.EMAIL_FROM) return "resend";
  return null;
}

/** The From address, e.g. "Sidekick <hello@trysidekick.ca>". */
export function senderAddress(): string | null {
  return process.env.EMAIL_FROM ?? (process.env.SMTP_USER ? `Sidekick <${process.env.SMTP_USER}>` : null);
}

/** Throws unless the provider confirms it accepted the message. */
export async function deliverEmail(message: OutgoingEmail): Promise<void> {
  const provider = emailProvider();
  if (provider === "smtp") return sendViaSmtp(message);
  if (provider === "resend") return sendViaResend(message);
  throw new Error("No email provider configured");
}

function smtpTransport() {
  const host = smtpHost()!;
  const port = Number(process.env.SMTP_PORT ?? 465);
  // Google shows App Passwords as "abcd efgh ijkl mnop"; the spaces aren't part of it.
  const pass = host === "smtp.gmail.com" ? process.env.SMTP_PASS!.replace(/\s+/g, "") : process.env.SMTP_PASS!;
  return createTransport({
    host,
    port,
    secure: process.env.SMTP_SECURE ? process.env.SMTP_SECURE === "true" : port === 465,
    auth: { user: process.env.SMTP_USER!, pass },
    connectionTimeout: 10_000,
    greetingTimeout: 10_000,
    socketTimeout: 10_000,
  });
}

/**
 * Signs in to the email provider without sending anything, for the dashboard's
 * "Test connection". With SMTP that's a real login, so a wrong password, or a
 * Zoho plan that can't send from apps, shows up here instead of on the next signup.
 */
export async function checkEmailLogin(): Promise<{ ok: true; detail: string } | { ok: false; detail: string }> {
  const provider = emailProvider();
  try {
    if (provider === "smtp") {
      await smtpTransport().verify();
      return { ok: true, detail: `${smtpHost()} accepted the login for ${process.env.SMTP_USER}.` };
    }
    if (provider === "resend") {
      const response = await fetch("https://api.resend.com/domains", {
        headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}` },
        signal: AbortSignal.timeout(10_000),
      });
      return response.ok
        ? { ok: true, detail: "Resend accepted the API key." }
        : { ok: false, detail: `Resend refused the API key (HTTP ${response.status}).` };
    }
    return { ok: false, detail: "No email provider is configured." };
  } catch (e) {
    return { ok: false, detail: e instanceof Error ? e.message : String(e) };
  }
}

async function sendViaSmtp({ to, subject, text, html, idempotencyKey, headers }: OutgoingEmail) {
  const transport = smtpTransport();
  const info = await transport.sendMail({
    from: senderAddress()!,
    to,
    subject,
    text,
    html,
    headers: { "X-Entity-Ref-ID": idempotencyKey, ...headers },
  });
  const accepted = (info.accepted as (string | { address: string })[]).map((a) => (typeof a === "string" ? a : a.address).toLowerCase());
  if (!accepted.includes(to.toLowerCase())) throw new Error("SMTP server did not accept the recipient");
}

async function sendViaResend({ to, subject, text, html, idempotencyKey, headers }: OutgoingEmail) {
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      "Content-Type": "application/json",
      "Idempotency-Key": idempotencyKey,
    },
    body: JSON.stringify({ from: process.env.EMAIL_FROM, to: [to], subject, text, html, headers }),
    signal: AbortSignal.timeout(10_000),
  });
  if (!response.ok) throw new Error(`Email provider rejected the request (HTTP ${response.status})`);
  const result = (await response.json()) as { id?: string };
  if (!result.id) throw new Error("Email provider did not confirm the request");
}
