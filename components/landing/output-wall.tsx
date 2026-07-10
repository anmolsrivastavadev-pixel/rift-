import { FileText } from "lucide-react";
import { Container } from "@/components/container";

/* "What comes out" section: big editorial cards describing what every
 * generated idea actually contains. Sticky headline on the left, large-type
 * cards on the right.
 */

const outputs = [
  {
    label: "Pain signal",
    text: "The repeated problem, with the real complaints that prove people actually feel it.",
  },
  {
    label: "Idea angle",
    text: "A product direction with a target customer, their current workarounds, and why those fall short.",
  },
  {
    label: "Validation test",
    text: "The questions to ask real people before you write a single line of code.",
  },
];

export function OutputWall() {
  return (
    <section className="relative py-20 sm:py-28">
      <div
        aria-hidden
        className="pointer-events-none absolute right-0 top-1/4 -z-10 h-[500px] w-[800px] translate-x-1/4 rounded-full blur-3xl"
        style={{
          background:
            "radial-gradient(ellipse at center, rgba(30,64,175,0.09) 0%, transparent 70%)",
        }}
      />
      <Container className="grid items-start gap-10 lg:grid-cols-[2fr_3fr] lg:gap-16">
        {/* Sticky headline */}
        <div className="lg:sticky lg:top-24">
          <span className="inline-flex items-center gap-2 rounded-full border border-[var(--color-primary)]/30 bg-[var(--color-primary-soft)] px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.14em] text-[var(--color-primary)]">
            <FileText className="h-3.5 w-3.5" aria-hidden />
            What comes out
          </span>
          <h2 className="mt-6 text-balance text-3xl font-bold tracking-tight text-[var(--color-foreground)] sm:text-4xl">
            A brief sharp enough{" "}
            <span className="text-[var(--color-primary)]">to act on.</span>
          </h2>
          <p className="mt-4 leading-relaxed text-[var(--color-muted-foreground)]">
            Every idea Rift generates carries the same three things, so you
            always know what you are looking at and what to do next.
          </p>
        </div>

        {/* Output cards */}
        <div className="space-y-4">
          {outputs.map((o) => (
            <article
              key={o.label}
              className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] p-7 transition-all duration-150 ease-out hover:-translate-y-0.5 hover:border-[var(--color-primary)]/30 hover:shadow-[var(--shadow-card-hover)] sm:p-9"
              style={{
                backgroundImage:
                  "radial-gradient(circle at 100% 0%, rgba(59,130,246,0.09), transparent 60%)",
              }}
            >
              <span className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--color-primary)]">
                {o.label}
              </span>
              <p className="mt-4 text-xl font-semibold leading-snug tracking-tight text-[var(--color-foreground)] sm:text-2xl">
                {o.text}
              </p>
            </article>
          ))}
        </div>
      </Container>
    </section>
  );
}
