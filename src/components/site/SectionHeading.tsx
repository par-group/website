export function SectionHeading({
  eyebrow,
  title,
  intro,
  tone = "light",
  className = "",
}: {
  eyebrow: string;
  title: React.ReactNode;
  intro?: React.ReactNode;
  tone?: "light" | "dark";
  className?: string;
}) {
  return (
    <div className={`max-w-2xl ${className}`}>
      <p className={`eyebrow ${tone === "dark" ? "text-mustard" : "text-green"}`}>{eyebrow}</p>
      <h2 className="mt-3 font-serif text-3xl leading-tight font-semibold text-balance sm:text-[2.6rem]">{title}</h2>
      {intro && <p className={`mt-4 text-lg leading-relaxed ${tone === "dark" ? "text-white/75" : "text-ink-soft"}`}>{intro}</p>}
    </div>
  );
}
