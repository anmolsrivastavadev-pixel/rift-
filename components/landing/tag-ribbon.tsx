/* Angled, slowly scrolling ribbon of capability chips between the hero and
 * the features section. Pure CSS animation (see .animate-ribbon in
 * globals.css); pauses automatically for reduced-motion users.
 */

const tags = [
  "app reviews",
  "reddit threads",
  "support tickets",
  "pricing complaints",
  "repeated pain",
  "idea scoring",
  "validation questions",
  "compare boards",
  "market gaps",
  "customer quotes",
];

/* Chips cycle through the brand accents (blue, green, amber, neutral) so the
 * ribbon reads as a living mix instead of a single-color strip.
 */
const chipStyles = [
  "border-[var(--color-primary)]/30 bg-[var(--color-primary-soft)] text-[#a9c7fb]",
  "border-[var(--color-success)]/30 bg-[var(--color-success-soft)] text-[#a7e8bc]",
  "border-[var(--color-border)] bg-[var(--color-card)] text-[var(--color-muted-foreground)]",
  "border-[var(--color-warning)]/30 bg-[var(--color-warning-soft)] text-[#f4cf92]",
];

function Row({ reverse }: { reverse?: boolean }) {
  const doubled = [...tags, ...tags];
  return (
    <div
      className={`flex w-max gap-3 ${reverse ? "animate-ribbon-reverse" : "animate-ribbon"}`}
    >
      {doubled.map((tag, i) => (
        <span
          key={`${tag}-${i}`}
          className={`whitespace-nowrap rounded-full border px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.08em] ${chipStyles[i % chipStyles.length]}`}
        >
          {tag}
        </span>
      ))}
    </div>
  );
}

export function TagRibbon() {
  return (
    <section aria-hidden className="relative overflow-hidden py-10 sm:py-14">
      <div className="-mx-8 -rotate-2 space-y-3">
        <Row />
        <Row reverse />
      </div>
      {/* Edge fades into the page background */}
      <div className="pointer-events-none absolute inset-y-0 left-0 w-[18vw] bg-gradient-to-r from-[var(--color-background)] to-transparent" />
      <div className="pointer-events-none absolute inset-y-0 right-0 w-[18vw] bg-gradient-to-l from-[var(--color-background)] to-transparent" />
    </section>
  );
}
