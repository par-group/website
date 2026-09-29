import { LEGAL_LAST_UPDATED } from "@/lib/site";

/** Long-form page layout for the Privacy Policy and Terms, with readable typography. */
export function LegalDocument({ title, summary, children }: { title: string; summary: string; children: React.ReactNode }) {
  return (
    <div className="site-container py-16 sm:py-20">
      <article className="mx-auto max-w-3xl">
        <p className="text-xs font-semibold tracking-wide text-green uppercase">Last updated {LEGAL_LAST_UPDATED}</p>
        <h1 className="mt-3 font-serif text-4xl font-semibold sm:text-5xl">{title}</h1>
        <p className="mt-5 rounded-3xl bg-green-soft p-5 text-lg leading-relaxed text-ink">{summary}</p>
        <div className="mt-6 text-[16px] leading-relaxed text-ink-soft [&_a]:font-semibold [&_a]:text-green [&_a]:underline [&_h2]:mt-12 [&_h2]:font-serif [&_h2]:text-2xl [&_h2]:font-semibold [&_h2]:text-ink [&_li]:mt-2 [&_p]:mt-4 [&_strong]:text-ink [&_ul]:mt-4 [&_ul]:list-disc [&_ul]:pl-5">
          {children}
        </div>
      </article>
    </div>
  );
}
