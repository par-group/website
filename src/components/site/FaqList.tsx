export type Faq = { question: string; answer: React.ReactNode };

/** Expandable questions; works without JavaScript. */
export function FaqList({ items }: { items: Faq[] }) {
  return (
    <div className="flex flex-col gap-3">
      {items.map(({ question, answer }) => (
        <details key={question} className="group card px-5 py-4 open:pb-5">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-semibold [&::-webkit-details-marker]:hidden">
            {question}
            <span className="grid size-7 shrink-0 place-items-center rounded-full bg-green-soft text-green transition group-open:rotate-45" aria-hidden>
              +
            </span>
          </summary>
          <div className="mt-3 leading-relaxed text-ink-soft [&_a]:font-semibold [&_a]:text-green [&_a]:underline [&_p+p]:mt-3 [&_strong]:text-ink">
            {answer}
          </div>
        </details>
      ))}
    </div>
  );
}
