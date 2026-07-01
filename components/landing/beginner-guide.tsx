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

        <p className="mt-8 text-center text-sm text-[var(--color-muted-foreground)]">
          Scores are sorting guides, not proof that an idea will work.
        </p>
      </Container>
    </section>
  );
}
