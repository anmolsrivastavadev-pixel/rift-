import { Check, Layers } from "lucide-react";
import { Container } from "@/components/container";
import { SectionHeader } from "@/components/landing/section-header";

/* Three feature cards, each topped with a small product-style preview built
 * from plain styled boxes (no real data, no images). Each preview plays a
 * looping ~7s mini-demo (see the demo-* keyframes in globals.css); with
 * prefers-reduced-motion everything renders in its final static state.
 */

function PreviewFindPain() {
  const rows = [
    { text: "“They never remind me about my appointment…”", hot: true, delay: 0.3 },
    { text: "“I can't tell what grooming will actually cost.”", hot: true, delay: 1.1 },
    { text: "“Booked online and nobody confirmed.”", hot: false, delay: 1.9 },
  ];
  return (
    <div className="space-y-2">
      {rows.map((row) => (
        <div
          key={row.text}
          className="animate-demo-item flex items-center gap-2.5 rounded-lg border border-[var(--color-border)] bg-[var(--color-card)] px-3 py-2"
          style={{ animationDelay: `${row.delay}s` }}
        >
          <span
            className={`h-1.5 w-1.5 shrink-0 rounded-full ${
              row.hot
                ? "animate-demo-pulse bg-[var(--color-primary)]"
                : "bg-[var(--color-muted-foreground)]/40"
            }`}
            aria-hidden
          />
          <p className="truncate text-xs text-[var(--color-muted-foreground)]">
            {row.text}
          </p>
        </div>
      ))}
      <p
        className="animate-demo-item pt-1 text-center text-[10px] uppercase tracking-wider text-[var(--color-muted-foreground)]/70"
        style={{ animationDelay: "2.9s" }}
      >
        2 repeated problems detected
      </p>
    </div>
  );
}

function PreviewScores() {
  const rows = [
    { label: "Missed bookings", score: 86, tone: "var(--color-success)", delay: 0.4 },
    { label: "Unclear pricing", score: 71, tone: "var(--color-primary)", delay: 1.2 },
    { label: "Long wait times", score: 58, tone: "var(--color-warning)", delay: 2.0 },
  ];
  return (
    <div className="space-y-3 pt-1">
      {rows.map((row) => (
        <div
          key={row.label}
          className="animate-demo-item"
          style={{ animationDelay: `${row.delay}s` }}
        >
          <div className="mb-1.5 flex items-center justify-between">
            <p className="text-xs text-[var(--color-muted-foreground)]">{row.label}</p>
            <span
              className="animate-demo-pop text-xs font-semibold tabular-nums"
              style={{ color: row.tone, animationDelay: `${row.delay + 0.7}s` }}
            >
              {row.score}
            </span>
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-[var(--color-surface)]">
            <div
              className="animate-demo-bar h-full rounded-full"
              style={{
                width: `${row.score}%`,
                backgroundColor: row.tone,
                animationDelay: `${row.delay + 0.15}s`,
              }}
            />
          </div>
        </div>
      ))}
      <p
        className="animate-demo-item pt-1 text-center text-[10px] uppercase tracking-wider text-[var(--color-muted-foreground)]/70"
        style={{ animationDelay: "3.2s" }}
      >
        Same data, same score, every time
      </p>
    </div>
  );
}

function PreviewDecide() {
  const checks = [
    { text: "Talked to 5 real people", delay: 0.5 },
    { text: "Found 3 paying workarounds", delay: 1.4 },
  ];
  return (
    <div className="space-y-2">
      {checks.map((item) => (
        <div
          key={item.text}
          className="animate-demo-item flex items-center gap-2.5 rounded-lg border border-[var(--color-border)] bg-[var(--color-card)] px-3 py-2"
          style={{ animationDelay: `${item.delay}s` }}
        >
          <span
            className="animate-demo-pop flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-[var(--color-success-soft)]"
            style={{ animationDelay: `${item.delay + 0.35}s` }}
          >
            <Check className="h-2.5 w-2.5 text-[var(--color-success)]" aria-hidden />
          </span>
          <p className="truncate text-xs text-[var(--color-muted-foreground)]">
            {item.text}
          </p>
        </div>
      ))}
      <div className="flex justify-center gap-2 pt-1.5">
        <span
          className="animate-demo-pop rounded-full bg-[var(--color-success-soft)] px-3 py-1 text-xs font-semibold text-[var(--color-success)]"
          style={{ animationDelay: "3.1s" }}
        >
          Pursue
        </span>
        <span
          className="animate-demo-item rounded-full border border-[var(--color-border)] px-3 py-1 text-xs text-[var(--color-muted-foreground)]"
          style={{ animationDelay: "2.5s" }}
        >
          Park
        </span>
        <span
          className="animate-demo-item rounded-full border border-[var(--color-border)] px-3 py-1 text-xs text-[var(--color-muted-foreground)]"
          style={{ animationDelay: "2.6s" }}
        >
          Reject
        </span>
      </div>
    </div>
  );
}

const features = [
  {
    n: "01",
    title: "Find real pain",
    text: "Type any market and Rift searches seven places at once — every complaint linked to the original post. Or bring your own reviews and tickets.",
    tags: ["7 sources", "Linked receipts", "Paste text", "CSV upload"],
    preview: <PreviewFindPain />,
  },
  {
    n: "02",
    title: "Score every idea in the open",
    text: "Rift groups repeated complaints into ideas and scores each one 0–100 with a formula you can inspect, never a black box.",
    tags: ["AI grouping", "0–100 score", "Score breakdown"],
    preview: <PreviewScores />,
  },
  {
    n: "03",
    title: "Compare and decide",
    text: "Put 2–3 ideas side by side, work a validation checklist, and mark each one Pursue, Park, or Reject.",
    tags: ["Compare board", "Checklist", "Share reports"],
    preview: <PreviewDecide />,
  },
];

export function Features() {
  return (
    <section id="features" className="relative scroll-mt-24 py-20 sm:py-28">
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-0 -z-10 h-[500px] w-[1000px] -translate-x-1/2 rounded-full blur-3xl"
        style={{
          background:
            "radial-gradient(ellipse at center, rgba(30,64,175,0.10) 0%, transparent 70%)",
        }}
      />
      <Container>
        <SectionHeader
          icon={Layers}
          badge="Highlights"
          heading={
            <>
              Everything you need to find{" "}
              <span className="text-[var(--color-primary)]">your next idea.</span>
            </>
          }
          lead="From raw complaints to a decision you can stand behind. Grouped by AI, scored transparently, validated by you."
        />

        <div className="mt-12 grid gap-5 md:grid-cols-3">
          {features.map((f) => (
            <div
              key={f.n}
              className="flex flex-col overflow-hidden rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] shadow-[var(--shadow-card)] transition-all duration-150 ease-out hover:-translate-y-0.5 hover:shadow-[var(--shadow-card-hover)]"
            >
              <div className="border-b border-[var(--color-border)] bg-[var(--color-background)]/60 p-4">
                {f.preview}
              </div>
              <div className="flex flex-1 flex-col p-5">
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--color-primary)]">
                  {f.n}
                </p>
                <h3 className="mt-2 text-base font-semibold text-[var(--color-foreground)]">
                  {f.title}
                </h3>
                <p className="mt-2 flex-1 text-sm leading-relaxed text-[var(--color-muted-foreground)]">
                  {f.text}
                </p>
                <div className="mt-4 flex flex-wrap gap-1.5">
                  {f.tags.map((tag) => (
                    <span
                      key={tag}
                      className="rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] px-2.5 py-1 text-xs text-[var(--color-muted-foreground)]"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </Container>
    </section>
  );
}
