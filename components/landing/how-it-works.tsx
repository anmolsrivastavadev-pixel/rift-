import { Container } from "@/components/container";

const steps = [
  {
    n: "1",
    title: "Choose a market or paste complaints",
    text: "Start fast with starter examples, or use real complaints for stronger results.",
  },
  {
    n: "2",
    title: "Generate business idea hypotheses",
    text: "Rift groups repeated pain into possible business ideas.",
  },
  {
    n: "3",
    title: "Compare ideas",
    text: "Pick 2\u20133 ideas and choose which one to test first.",
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
          <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">
            How Rift works
          </h2>
        </div>

        <div className="mx-auto mt-14 grid max-w-3xl gap-4 sm:grid-cols-2">
          {steps.map((s) => (
            <div
              key={s.n}
              className="flex gap-4 rounded-[12px] border border-[var(--color-border)] bg-[var(--color-card)] p-5"
            >
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--color-primary)]/10 text-sm font-semibold text-[var(--color-primary)]">
                {s.n}
              </span>
              <div>
                <h3 className="text-sm font-semibold">{s.title}</h3>
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
