import { Container } from "@/components/container";

const steps = [
  {
    n: "1",
    title: "Choose a market or paste complaints",
    text: "Start fast with starter examples, or use real complaints for stronger results.",
  },
  {
    n: "2",
    title: "Find ideas",
    text: "Rift groups repeated complaints into possible ideas.",
  },
  {
    n: "3",
    title: "Compare ideas",
    text: "Pick 2 to 3 ideas and choose which one to test first.",
  },
  {
    n: "4",
    title: "Test with real people",
    text: "Scores help you inspect ideas. They do not prove demand.",
  },
];

export function HowItWorks() {
  return (
    <section id="how-it-works" className="py-20 sm:py-28">
      <Container>
        <div className="mx-auto max-w-2xl text-center">
          <p className="mb-3 text-xs font-medium uppercase tracking-wider text-[var(--color-muted-foreground)]">
            Process
          </p>
          <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl text-[var(--color-foreground)]">
            How Rift works
          </h2>
          <p className="mt-4 text-[var(--color-muted-foreground)] leading-relaxed">
            Four steps from a market to an idea you can test.
          </p>
        </div>

        <div className="mx-auto mt-10 grid max-w-3xl gap-4 sm:grid-cols-2">
          {steps.map((s) => (
            <div
              key={s.n}
              className="flex gap-4 rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] p-5 shadow-[0_1px_3px_0_rgb(0_0_0_/_0.3),0_1px_2px_-1px_rgb(0_0_0_/_0.2)] transition-all duration-150 ease-out hover:-translate-y-0.5 hover:shadow-[0_4px_12px_0_rgb(0_0_0_/_0.4),0_2px_4px_-2px_rgb(0_0_0_/_0.3)]"
            >
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--color-primary-soft)] text-sm font-semibold text-[var(--color-primary)] ring-1 ring-[var(--color-primary)]/20">
                {s.n}
              </span>
              <div>
                <h3 className="text-sm font-semibold text-[var(--color-foreground)]">{s.title}</h3>
                <p className="mt-1 text-sm text-[var(--color-muted-foreground)] leading-relaxed">
                  {s.text}
                </p>
              </div>
            </div>
          ))}
        </div>
      </Container>
    </section>
  );
}
