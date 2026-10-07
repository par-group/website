import "server-only";
import { SITE } from "@/lib/site";
import { deliverEmail } from "@/server/mailer";
import { markConfirmationSent } from "@/server/waitlist";

// The email new signups get: a thank-you, and a way to remove the address if
// someone else typed it. Sent once, on the first signup for an address.

const COLORS = { bg: "#f7faf9", surface: "#ffffff", ink: "#0f2a2e", soft: "#4f6e6b", accent: "#0f766e", line: "#dce9e6" };
const SANS = "-apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif";
const SERIF = "Georgia, 'Times New Roman', serif";

const escape = (text: string) => text.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);

const PARAGRAPHS = [
  "We’re thrilled you joined the Sidekick waitlist!",
  "Sidekick is the friends-only app for York students: swipe through people who share your campus, major and interests, reply to whatever catches your eye, and turn it into plans.",
  "We’re putting the finishing touches on the app now. Stay tuned: you’ll be among the first to hear our news, see sneak peeks, and get your invite the day we launch at York.",
];

export function confirmationEmail(removeUrl: string): { subject: string; text: string; html: string } {
  const subject = "You’re on the Sidekick waitlist 🎉";
  const notYou = "Didn’t join? Someone may have used your email by mistake.";
  const footer = `${SITE.name} is independent and isn’t affiliated with York University.`;

  const text = [
    "Hi there,",
    ...PARAGRAPHS,
    `Talk soon,\nThe Sidekick team\n${SITE.url}`,
    "—",
    `${notYou} Remove it from the waitlist:\n${removeUrl}`,
    footer,
  ].join("\n\n");

  const paragraph = (content: string) =>
    `<tr><td style="padding-top:16px;font-family:${SANS};font-size:16px;line-height:1.6;color:${COLORS.ink};">${content}</td></tr>`;

  const html = `<!doctype html>
<html lang="en">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escape(subject)}</title></head>
<body style="margin:0;padding:0;background:${COLORS.bg};">
<div style="display:none;max-height:0;overflow:hidden;">You’ll be among the first to know when Sidekick launches at York.</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${COLORS.bg};">
  <tr><td align="center" style="padding:32px 16px;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background:${COLORS.surface};border-radius:24px;">
      <tr><td style="padding:36px 32px 32px;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
          <tr><td style="font-family:${SERIF};font-size:26px;font-weight:700;color:${COLORS.ink};">side<span style="color:${COLORS.accent};">kick</span></td></tr>
          <tr><td style="padding-top:28px;font-family:${SERIF};font-size:28px;line-height:1.2;font-weight:700;color:${COLORS.ink};">You’re on the list!</td></tr>
          ${paragraph("Hi there,")}
          ${PARAGRAPHS.map((p) => paragraph(escape(p))).join("\n          ")}
          <tr><td style="padding-top:28px;">
            <a href="${escape(SITE.url)}" style="display:inline-block;background:${COLORS.accent};color:#ffffff;border-radius:999px;padding:12px 22px;font-family:${SANS};font-size:15px;font-weight:600;text-decoration:none;">Visit ${escape(SITE.displayUrl)}</a>
          </td></tr>
          ${paragraph("Talk soon,<br>The Sidekick team")}
        </table>
      </td></tr>
    </table>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;">
      <tr><td style="padding:20px 32px 0;font-family:${SANS};font-size:13px;line-height:1.6;color:${COLORS.soft};">
        ${escape(notYou)} <a href="${escape(removeUrl)}" style="color:${COLORS.accent};font-weight:600;">Remove it from the waitlist</a>.
      </td></tr>
      <tr><td style="padding:8px 32px 0;font-family:${SANS};font-size:12px;line-height:1.6;color:${COLORS.soft};">${escape(footer)}</td></tr>
    </table>
  </td></tr>
</table>
</body>
</html>`;

  return { subject, text, html };
}

/** Sends the confirmation, and records it. Failures are logged, never shown to the person who signed up. */
export async function sendWaitlistConfirmation(signup: { id: string; email: string }, removalToken: string): Promise<void> {
  const removeUrl = `${SITE.url}/waitlist/remove/${removalToken}`;
  try {
    await deliverEmail({
      to: signup.email,
      ...confirmationEmail(removeUrl),
      idempotencyKey: `waitlist-confirmation-${signup.id}`,
      // Mail apps show their own "Unsubscribe" with this, leading to the same page.
      headers: { "List-Unsubscribe": `<${removeUrl}>` },
    });
    await markConfirmationSent(signup.id);
  } catch (e) {
    console.error("waitlist: confirmation email failed", e);
  }
}
