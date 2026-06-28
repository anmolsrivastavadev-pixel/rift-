import { Container } from "@/components/container";

const steps = [
  {
    n: "01",
    title: "Upload complaints",
    text: "Import a CSV of real customer complaints from support, reviews or forums.",
  },
  {
    n: "02",
    title: "AI clusters them",
    text: "Gemini groups similar complaints and summarises the core problem for each cluster.",
  },
  {
    n: "03",
    title: "Score & rank",
    text: "Rift scores each opportunity 0–100 using frequency, sentiment, severity and growth.",
  },
  {
    n: "04",
    title: "Explore & save",
    text: "Browse ranked opportunities, inspect the underlying complaints, and save the keepers.",
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
          <p className="mt-4 text-[var(--color-muted-foreground)]">
            A repeatable pipeline from raw complaints to a ranked opportunity
            list.
          </p>
        </div>

        <ol className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {steps.map((s) => (
            <li
              key={s.n}
              className="rounded-[12px] border border-[var(--color-border)] bg-[var(--color-card)] p-6"
            >
              <span className="text-xs font-medium text-[var(--color-primary)]">
                {s.n}
              </span>
              <h3 className="mt-3 text-base font-semibold">{s.title}</h3>
              <p className="mt-2 text-sm text-[var(--color-muted-foreground)]">
                {s.text}
              </p>
            </li>
          ))}
        </ol>
      </Container>
    </section>
  );
}