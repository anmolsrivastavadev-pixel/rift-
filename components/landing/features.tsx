import { Container } from "@/components/container";

const modes = [
  {
    label: "Quick ideas",
    description:
      "Type any market and get starter complaint examples for brainstorming.",
    highlight: false,
  },
  {
    label: "Real research",
    description:
      "Paste real reviews, complaints, or support tickets for stronger evidence.",
    highlight: true,
  },
];

const comparePoints = [
  "Person",
  "Problem",
  "Solution",
  "Evidence",
  "Risk",
  "Next step",
];

export function Features() {
  return (
    <section id="features" className="py-20 sm:py-28">
      <Container>
        {/* Quick ideas vs real research */}
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl text-[var(--color-foreground)]">
            Quick ideas vs real research
          </h2>
        </div>

        <div className="mx-auto mt-10 grid max-w-2xl gap-4 sm:grid-cols-2">
          {modes.map((m) => (
            <div
              key={m.label}
              className={`rounded-xl border p-6 text-left shadow-[0_1px_3px_0_rgb(0_0_0_/_0.3),0_1px_2px_-1px_rgb(0_0_0_/_0.2)] transition-all duration-150 ease-out hover:-translate-y-0.5 hover:shadow-[0_4px_12px_0_rgb(0_0_0_/_0.4),0_2px_4px_-2px_rgb(0_0_0_/_0.3)] ${
                m.highlight
                  ? "border-[var(--color-primary)]/30 bg-[var(--color-primary)]/5"
                  : "border-[var(--color-border)] bg-[var(--color-card)]"
              }`}
            >
              <h3
                className={`text-base font-semibold ${
                  m.highlight ? "text-[var(--color-primary)]" : "text-[var(--color-foreground)]"
                }`}
              >
                {m.label}
              </h3>
              <p className="mt-2 text-sm text-[var(--color-muted-foreground)] leading-relaxed">
                {m.description}
              </p>
            </div>
          ))}
        </div>

        {/* Compare ideas */}
        <div className="mx-auto mt-16 max-w-2xl">
          <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] p-6 shadow-[0_1px_3px_0_rgb(0_0_0_/_0.3),0_1px_2px_-1px_rgb(0_0_0_/_0.2)]">
            <h3 className="text-base font-semibold text-[var(--color-foreground)]">Compare ideas</h3>
            <p className="mt-2 text-sm text-[var(--color-muted-foreground)]">
              Compare 2\u20133 ideas side by side by:
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              {comparePoints.map((point) => (
                <span
                  key={point}
                  className="rounded-full border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-1 text-xs text-[var(--color-muted-foreground)]"
                >
                  {point}
                </span>
              ))}
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}
