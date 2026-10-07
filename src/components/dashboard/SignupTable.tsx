import Link from "next/link";
import { RemoveSignupButton } from "@/components/dashboard/RemoveSignupButton";
import { TIME_ZONE } from "@/lib/calendar";
import { signupFiltersQuery } from "@/lib/signup-filters";
import { PLATFORMS } from "@/lib/waitlist";
import type { WaitlistSignup } from "@/server/waitlist";

const signedUp = new Intl.DateTimeFormat("en-CA", { timeZone: TIME_ZONE, dateStyle: "medium", timeStyle: "short" });
const none = <span className="text-ink-soft">–</span>;

/** One page of waitlist signups. `accounts` adds whether each has an app account, once the app has data. */
export function SignupTable({ rows, accounts }: { rows: WaitlistSignup[]; accounts: Set<string> | null }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[52rem] border-collapse text-sm">
        <thead>
          <tr className="border-b border-line text-left text-xs tracking-wide text-ink-soft uppercase">
            <th scope="col" className="px-5 py-3 font-semibold">
              Email
            </th>
            <th scope="col" className="px-3 py-3 font-semibold">
              School
            </th>
            <th scope="col" className="px-3 py-3 font-semibold">
              Phone
            </th>
            <th scope="col" className="px-3 py-3 font-semibold">
              Source
            </th>
            <th scope="col" className="px-3 py-3 font-semibold">
              Signed up (Toronto)
            </th>
            <th scope="col" className="px-3 py-3 font-semibold">
              Emailed
            </th>
            {accounts && (
              <th scope="col" className="px-5 py-3 font-semibold">
                App account
              </th>
            )}
            <th scope="col" className="px-5 py-3">
              <span className="sr-only">Remove</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.id} className="border-t border-line/60 transition-colors hover:bg-bg">
              <td className="px-5 py-3 font-medium">
                <a href={`mailto:${row.email}`} className="hover:underline">
                  {row.email}
                </a>
              </td>
              <td className="px-3 py-3">{row.school ?? none}</td>
              <td className="px-3 py-3">{row.platform ? PLATFORMS[row.platform] : none}</td>
              <td className="px-3 py-3">
                {row.source ? (
                  <Link href={`/dashboard/waitlist${signupFiltersQuery({ source: row.source })}#people`} className="text-green hover:underline">
                    {row.source}
                  </Link>
                ) : (
                  <span className="text-ink-soft">Direct</span>
                )}
              </td>
              <td className="px-3 py-3 whitespace-nowrap tabular-nums">
                <time dateTime={new Date(row.created_at).toISOString()}>{signedUp.format(row.created_at)}</time>
              </td>
              <td className="px-3 py-3 whitespace-nowrap">
                {row.confirmation_sent_at ? (
                  <span className="text-green" title={`Confirmation sent ${signedUp.format(row.confirmation_sent_at)}`}>
                    ✓ Sent
                  </span>
                ) : (
                  none
                )}
              </td>
              {accounts && <td className="px-5 py-3">{accounts.has(row.email) ? <span className="font-semibold text-green">✓ Yes</span> : none}</td>}
              <td className="px-5 py-2 text-right">
                <RemoveSignupButton id={row.id} email={row.email} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/** Previous / next links between pages of the list, keeping its filters. */
export function Pagination({ page, pages, href }: { page: number; pages: number; href: (page: number) => string }) {
  if (pages <= 1) return null;
  const link = (to: number, label: string) =>
    to < 1 || to > pages ? (
      <span aria-disabled className="btn-ghost cursor-not-allowed opacity-45">
        {label}
      </span>
    ) : (
      <Link href={href(to)} className="btn-secondary">
        {label}
      </Link>
    );
  return (
    <nav aria-label="Pages of signups" className="flex items-center justify-between gap-3 border-t border-line px-5 py-4 text-sm">
      {link(page - 1, "← Newer")}
      <span className="text-ink-soft tabular-nums">
        Page {page} of {pages}
      </span>
      {link(page + 1, "Older →")}
    </nav>
  );
}
