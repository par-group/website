"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { removeSignup } from "@/server/actions/dashboard";

/** Removes one signup from the waitlist, after a confirmation. */
export function RemoveSignupButton({ id, email }: { id: string; email: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const remove = () => {
    if (!window.confirm(`Remove ${email} from the waitlist? This can’t be undone.`)) return;
    startTransition(async () => {
      try {
        const result = await removeSignup(id);
        if (!result.ok) window.alert(result.detail);
      } catch {
        window.alert("Couldn’t remove it. Check your connection and try again.");
      }
      router.refresh();
    });
  };

  return (
    <button
      type="button"
      onClick={remove}
      disabled={pending}
      aria-label={`Remove ${email}`}
      className="rounded-full px-2.5 py-1 text-xs font-semibold text-ink-soft transition hover:bg-danger/10 hover:text-danger disabled:opacity-45"
    >
      {pending ? "Removing…" : "Remove"}
    </button>
  );
}
