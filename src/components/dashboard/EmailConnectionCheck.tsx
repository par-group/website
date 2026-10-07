"use client";

import { useState, useTransition } from "react";
import { testEmailConnection, type ActionResult } from "@/server/actions/dashboard";

/** Setup's "Test connection" for confirmation emails, with the provider's answer. */
export function EmailConnectionCheck() {
  const [result, setResult] = useState<ActionResult | null>(null);
  const [pending, startTransition] = useTransition();

  const test = () =>
    startTransition(async () => {
      try {
        setResult(await testEmailConnection());
      } catch {
        setResult({ ok: false, detail: "Couldn’t reach the website. Check your connection and try again." });
      }
    });

  return (
    <div className="mt-3 flex flex-wrap items-center gap-3">
      <button type="button" onClick={test} disabled={pending} className="btn-secondary px-4 py-2 text-sm">
        {pending ? "Testing…" : "Test connection"}
      </button>
      {result && (
        <p role="status" className={`text-sm font-semibold [overflow-wrap:anywhere] ${result.ok ? "text-green" : "text-danger"}`}>
          {result.ok ? "✓ " : "! "}
          {result.detail}
          {!result.ok && (
            <span className="block font-normal text-ink-soft">
              Check SMTP_HOST and SMTP_PORT, that SMTP_PASS is a Zoho app password (not your login password), and that your Zoho plan allows sending
              from apps.
            </span>
          )}
        </p>
      )}
    </div>
  );
}
