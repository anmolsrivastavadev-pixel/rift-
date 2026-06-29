import { Container } from "@/components/container";

const steps = [
  {
    n: "01",
    title: "Add pain data",
    text: "Upload a CSV of complaints or reviews, or load demo data to explore the flow with zero setup.",
  },
  {
    n: "02",
    title: "AI clusters them",
    text: "Gemini groups similar complaints and writes a clear problem summary for each cluster.",
  },
  {
    n: "03",
    title: "Score & rank",
    text: "Rift scores each opportunity 0–100 from frequency, severity, and confidence — the same data always gives the same score.",
  },
  {
    n: "04",
    title: "Explore & save",
    text: "Browse ranked opportunities, read the real complaints behind each one, and save the ideas worth building.",
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