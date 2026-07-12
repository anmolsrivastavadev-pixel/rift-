import Link from "next/link";
import { HelpCircle, Plus } from "lucide-react";
import { Container } from "@/components/container";

const faqs: { q: string; a: React.ReactNode }[] = [
  {
    q: "Do I need any experience with customer research?",
    a: (
      <>
        No. Rift is built for first-time founders and side-project builders.
        If you can type a market you&apos;re curious about, you can use it —
        the{" "}
        <Link
          href="/#example"
          className="text-[var(--color-primary)] hover:underline"
        >
          full example
        </Link>{" "}
        shows exactly what you get back.
      </>
    ),
  },
  {
    q: "Where do the customer problems come from?",
    a: (
      <>
        Type a market and the built-in finder collects complaints for you
        (the full list of places it searches is in the{" "}
        <Link
          href="/#sources"
          className="text-[var(--color-primary)] hover:underline"
        >
          sources map
        </Link>
        ). Or paste your own reviews, support messages, and things people
        tell you. Even 5 to 10 sentences is enough.
      </>
    ),
  },
  {
    q: "Can't I just use ChatGPT for this?",
    a: "A chat skims a few pages and forgets them; Rift stores every complaint with its source and scores ideas with the same fixed formula every time. The comparison above has the full side-by-side.",
  },
  {
    q: "Do the scores prove an idea will work?",
    a: "No, and Rift never pretends they do. Scores are transparent sorting guides computed by a fixed formula, so the same data always gives the same score. Real validation means talking to real people.",
  },
  {
    q: "Does the AI invent market statistics?",
    a: "Never. Every conclusion is grounded in the complaints Rift collected or you provided. The AI only groups repeated problems and summarises them. The score itself is computed by Rift, not the AI.",
  },
  {
    q: "Is my data private?",
    a: "Your complaints and ideas live in your account and are only used to generate your results. Nothing is public unless you explicitly create a share link, and you can revoke a link at any time. You can also delete your account, and everything in it, whenever you like.",
  },
  {
    q: "What does Rift cost?",
    a: "Nothing right now — everything is free during the beta, and no credit card is ever asked for. After the beta there will be a Free plan and a Pro plan at $9/month with higher limits. See the pricing page for details.",
  },
];

export function Faq() {
  return (
    <section id="faq" className="scroll-mt-24 py-20 sm:py-28">
      <Container>
        <div className="grid gap-10 lg:grid-cols-[2fr_3fr] lg:gap-16">
          {/* Left column */}
          <div>
            <p className="flex items-center gap-2 text-sm font-semibold text-[var(--color-primary)]">
              <HelpCircle className="h-4 w-4" aria-hidden />
              FAQ
            </p>
            <h2 className="mt-5 text-balance text-3xl font-bold tracking-tight text-[var(--color-foreground)] sm:text-4xl">
              Questions founders{" "}
              <span className="text-[var(--color-primary)]">
                actually ask.
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
                <p className="px-5 pb-5 text-base leading-relaxed text-[var(--color-muted-foreground)]">
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
