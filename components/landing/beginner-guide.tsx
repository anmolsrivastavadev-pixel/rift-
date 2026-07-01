import { Container } from "@/components/container";

const steps = [
  {
    n: "1",
    title: "Find customer pain",
    text: 'Customer pain means a problem, frustration, or annoying thing people keep mentioning. You can use demo data, product reviews, app reviews, Reddit/forum snippets you manually collect, support tickets, YouTube comments, or sales call notes.',
  },
  {
    n: "2",
    title: "Turn repeated problems into ideas",
    text: "Rift looks for patterns in those complaints and turns them into possible business ideas.",
  },
  {
    n: "3",
    title: "Test before you build",
    text: "Pick one idea, read the evidence, talk to 3–5 real people with that problem, then decide whether to pursue, park, or reject it.",
  },
];

export function BeginnerGuide() {
  return (
    <section id="beginner" className="py-20 sm:py-28 bg-[var(--color-card)]/50">
      <Container>
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">
            New to business ideas? Start here.
          </h2>
          <p className="mt-4 text-[var(--color-muted-foreground)]">
            You do not need to know startup jargon to use Rift. Start with a simple idea: when lots of people complain about the same problem, that problem may be worth solving.
          </p>
        </div>

        <ol className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
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

        <div className="mt-12 rounded-[12px] border border-dashed border-[var(--color-border)] bg-[var(--color-card)]/60 p-6">
          <p className="text-sm font-medium">Don't have complaints yet?</p>
          <ul className="mt-3 space-y-2 text-sm text-[var(--color-muted-foreground)]">
            <li className="flex items-start gap-2">
              <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--color-primary)]" />
              Start with the built-in demo data to see how it works
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--color-primary)]" />
              Read app store reviews (1–3 star) for any product you use
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--color-primary)]" />
              Screenshot Reddit, Twitter/X, or forum posts where people complain
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--color-primary)]" />
              Note things your friends, coworkers, or customers say annoy them
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--color-primary)]" />
              Paste a few complaint sentences — even 5–10 is enough to start
            </li>
          </ul>
          <p className="mt-3 text-xs text-[var(--color-muted-foreground)]">
            No scraping or automation needed. Collect manually — copy and paste works.
          </p>
        </div>

        <p className="mt-8 text-center text-sm text-[var(--color-muted-foreground)]">
          Scores are sorting guides, not proof that an idea will work.
        </p>
      </Container>
    </section>
  );
}
