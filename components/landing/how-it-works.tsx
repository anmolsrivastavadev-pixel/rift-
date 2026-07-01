import { Container } from "@/components/container";

const steps = [
  {
    n: "01",
    title: "Add customer pain",
    text: "Paste complaints, upload a file, or use demo data.",
  },
  {
    n: "02",
    title: "Generate business ideas",
    text: "Rift groups repeated problems into scored idea hypotheses.",
  },
  {
    n: "03",
    title: "Decide what to test",
    text: "Review evidence, risks, and next steps before pursuing an idea.",
  },
  {
    n: "04",
    title: "Compare and decide",
    text: "Review evidence, risks, and next steps. Decide which ideas to pursue, park, or reject.",
  },
];

export function HowItWorks() {
  return (
    <section id="how-it-works" className="py-20 sm:py-28">
      <Container>
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">
            The breakdown
          </h2>
          <p className="mt-4 text-[var(--color-muted-foreground)]">
            Four clear stages, end to end. No scraping feeds, no invented
            market sizes — only the signal in your own data.
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