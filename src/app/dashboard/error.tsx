"use client"; // Error boundaries must be Client Components

import Link from "next/link";
import { useEffect } from "react";

export default function DashboardError({ error, retry }: { error: Error & { digest?: string }; retry: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div role="alert" className="card max-w-2xl p-8">
      <h1 className="font-serif text-2xl font-semibold">This page couldn’t load.</h1>
      <p className="mt-2 text-ink-soft">
        Usually a database didn’t answer. The Setup tab shows which part isn’t working.
        {error.digest && (
          <>
            {" "}
            The server log has the details under code <code>{error.digest}</code>.
          </>
        )}
      </p>
      <div className="mt-6 flex gap-3">
        <button type="button" onClick={() => retry()} className="btn-primary">
          Try again
        </button>
        <Link href="/dashboard/setup" className="btn-secondary">
          Open Setup
        </Link>
      </div>
    </div>
  );
}
