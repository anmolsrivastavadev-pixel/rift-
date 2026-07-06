import { Route, Sparkles } from "lucide-react";
import { Container } from "@/components/container";
import { SectionHeader } from "@/components/landing/section-header";

const steps = [
  {
    n: "1",
    title: "Choose a market or paste complaints",
    text: "Start fast with starter examples, or use real complaints for stronger results.",
  },
  {
    n: "2",
    title: "Find ideas",
    text: "Rift groups repeated complaints into possible ideas and scores each one 0–100.",
    highlight: true,
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

const previewClusters = [
  { label: "missed bookings", count: "9 complaints", width: "86%" },
  { label: "unclear pricing", count: "7 complaints", width: "71%" },
  { label: "long wait times", count: "5 complaints", width: "58%" },
];

export function HowItWorks() {
  return (
    <section id="how-it-works" className="scroll-mt-24 py-20 sm:py-28">
      <Container>
        <SectionHeader
          icon={Route}
          badge="How it works"
          heading={
            <>
              It does not brainstorm.{" "}
              <span className="text-[var(--color-primary)]">It narrows.</span>
            </>
          }
          lead="Complaints go in, repeated pain gets grouped and scored, and you walk out with one idea worth testing first."
        />

        <div className="mt-12 grid items-start gap-8 lg:grid-cols-2 lg:gap-12">
          {/* Step list */}
          <ol className="space-y-3">
            {steps.map((s) => (
              <li
                key={s.n}
                className={`flex gap-4 rounded-xl border p-5 transition-all duration-150 ease-out ${
                  s.highlight
                    ? "border-[var(--color-primary)]/40 bg-[var(--color-primary)]/5"
                    : "border-[var(--color-border)] bg-[var(--color-card)] hover:border-[var(--color-border)] hover:bg-[var(--color-surface)]"
                }`}
              >
                <span
                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-semibold ${
                    s.highlight
                      ? "bg-[var(--color-primary)] text-white"
                      : "bg-[var(--color-primary-soft)] text-[var(--color-primary)] ring-1 ring-[var(--color-primary)]/20"
                  }`}
                >
                  {s.n}
                </span>
                <div>
                  <h3 className="text-sm font-semibold text-[var(--color-foreground)]">
                    {s.title}
                  </h3>
                  <p className="mt-1 text-sm leading-relaxed text-[var(--color-muted-foreground)]">
                    {s.text}
                  </p>
                </div>
              </li>
            ))}
          </ol>

          {/* Preview panel for the highlighted step */}
          <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] p-2 shadow-[var(--shadow-elevated)] lg:sticky lg:top-24">
            <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-background)] p-5">
              <div className="mb-5 flex items-center justify-between gap-3">
                <p className="text-xs text-[var(--color-muted-foreground)]">
                  Grouping 24 complaints…
                </p>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-[var(--color-primary-soft)] px-3 py-1 text-[11px] font-medium text-[var(--color-primary)]">
                  <Sparkles className="h-3 w-3" aria-hidden /> AI at work
                </span>
              </div>
              <div className="space-y-4">
                {previewClusters.map((c) => (
                  <div key={c.label}>
                    <div className="mb-1.5 flex items-center justify-between">
                      <p className="text-xs font-medium text-[var(--color-foreground)]">
                        {c.label}
                      </p>
                      <span className="text-[11px] tabular-nums text-[var(--color-muted-foreground)]">
                        {c.count}
                      </span>
                    </div>
                    <div className="h-1.5 overflow-hidden rounded-full bg-[var(--color-surface)]">
                      <div
                        className="h-full rounded-full bg-[var(--color-primary)]"
                        style={{ width: c.width }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <p className="px-3 py-2.5 text-center text-[11px] uppercase tracking-wider text-[var(--color-muted-foreground)]/70">
              Step 2 · Repeated problems become scored ideas
            </p>
          </div>
        </div>
      </Container>
    </section>
  );
}
