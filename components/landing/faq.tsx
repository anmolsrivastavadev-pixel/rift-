import { HelpCircle, Plus } from "lucide-react";
import { Container } from "@/components/container";

const faqs = [
  {
    q: "Where do I get complaints from?",
    a: "Paste app reviews, Reddit posts, support tickets, or things people tell you in real life. Even 5 to 10 sentences is enough. You can also upload a CSV, use the built-in complaint finder, or start with demo data.",
  },
  {
    q: "Do the scores prove an idea will work?",
    a: "No, and Rift never pretends they do. Scores are transparent sorting guides computed by a fixed formula, so the same data always gives the same score. Real validation means talking to real people.",
  },
  {
    q: "Does the AI invent market statistics?",
    a: "Never. Every conclusion is grounded in the complaints you provided. The AI only groups repeated problems and summarises them. The score itself is computed by Rift, not the AI.",
  },
  {
    q: "Is my data private?",
    a: "Your complaints and ideas live in your account and are only used to generate your results. Nothing is public unless you explicitly create a share link, and you can revoke a link at any time.",
  },
  {
    q: "What does Rift cost?",
    a: "Rift is free during the private beta. There is a Free plan for getting started and a Pro plan at $9/month with higher limits. See the pricing page for the details.",
  },
];

export function Faq() {
  return (
    <section id="faq" className="scroll-mt-24 py-20 sm:py-28">
      <Container>
        <div className="grid gap-10 lg:grid-cols-[2fr_3fr] lg:gap-16">
          {/* Left column */}
          <div>
            <span className="inline-flex items-center gap-2 rounded-full border border-[var(--color-primary)]/30 bg-[var(--color-primary-soft)] px-4 py-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--color-primary)]">
              <HelpCircle className="h-3.5 w-3.5" aria-hidden />
              FAQ
            </span>
            <h2 className="mt-6 text-balance text-3xl font-bold tracking-tight text-[var(--color-foreground)] sm:text-4xl">
              Questions,{" "}
              <span className="text-[var(--color-primary)]">
                answered honestly.
              </span>
            </h2>
            <p className="mt-4 leading-relaxed text-[var(--color-muted-foreground)]">
              What Rift is, what the scores actually mean, and what it costs.
            </p>
          </div>

          {/* Accordion — native details/summary, no JS */}
          <div className="space-y-3">
            {faqs.map((item) => (
              <details
                key={item.q}
                className="group rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] transition-colors duration-150 ease-out open:border-[var(--color-primary)]/30 hover:border-[var(--color-primary)]/30"
              >
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 p-5 text-sm font-semibold text-[var(--color-foreground)] [&::-webkit-details-marker]:hidden">
                  {item.q}
                  <Plus
                    className="h-4 w-4 shrink-0 text-[var(--color-primary)] transition-transform duration-150 ease-out group-open:rotate-45"
                    aria-hidden
                  />
                </summary>
                <p className="px-5 pb-5 text-sm leading-relaxed text-[var(--color-muted-foreground)]">
                  {item.a}
                </p>
              </details>
            ))}
          </div>
        </div>
      </Container>
    </section>
  );
}
