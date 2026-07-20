import { ArrowRight, Bookmark, Compass, Link2, Search, XCircle } from "lucide-react";
import { Container } from "@/components/container";
import { EurekaLink } from "@/components/landing/eureka";
import { SectionHeader } from "@/components/landing/section-header";

/* One complete worked example (July 2026 landing redesign): the same
 * dog-grooming story the hero opens, shown end to end — the evidence, the
 * idea it produced, and what you'd do next. All sample data, clearly marked.
 * The quotes are illustrative (no real posts are reproduced), so the source
 * names are plain labels, not links — the caption says links exist in the
 * real product.
 */

const quotes = [
  {
    text: "Nobody reminded me about my appointment, so I forgot. Again. Third time this year.",
    source: "Reddit",
  },
  {
    text: "Love my groomer but booking is a mess. I text her and hope she sees it.",
    source: "App review",
  },
  {
    text: "Got charged a no-show fee for an appointment I never knew was confirmed.",
    source: "The web",
  },
];

const nextActions = [
  {
    icon: Compass,
    label: "Explore it",
    text: "Read the full breakdown: who has this problem, what they do about it today, and the questions to ask them.",
  },
  {
    icon: Bookmark,
    label: "Save it for later",
    text: "Keep it on your shortlist and compare it side by side with other ideas.",
  },
  {
    icon: XCircle,
    label: "Dismiss it",
    text: "Not for you? Set it aside and move on to the next problem.",
  },
];

export function ExampleWalkthrough() {
  return (
    <section id="example" className="scroll-mt-24 py-20 sm:py-28">
      <Container>
        <SectionHeader
          icon={Search}
          badge="A full example"
          heading={
            <>
              From “dog grooming” to an idea{" "}
              <span className="text-[var(--color-primary)]">
                worth exploring.
              </span>
            </>
          }
          lead="This is one real-shaped result, end to end. It's sample data. Your results are built from real complaints in the market you choose."
        />

        <div className="mt-12 grid items-start gap-6 lg:grid-cols-2 lg:gap-8">
          {/* Left — the evidence */}
          <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] p-6 shadow-[var(--shadow-card)] sm:p-7">
            <h3 className="text-base font-semibold text-[var(--color-foreground)]">
              What people said
            </h3>
            <p className="mt-1.5 text-base leading-relaxed text-[var(--color-muted-foreground)]">
              Rift found 11 complaints describing the same problem. Here are
              three of them.
            </p>
            <ul className="mt-5 space-y-3">
              {quotes.map((q) => (
                <li
                  key={q.text}
                  className="rounded-xl border border-[var(--color-border)] bg-[var(--color-background)] px-4 py-3.5"
                >
                  <p className="text-base leading-relaxed text-[var(--color-foreground)]/90">
                    “{q.text}”
                  </p>
                  <p className="mt-2 text-sm text-[var(--color-muted-foreground)]">
                    Found on {q.source}
                  </p>
                </li>
              ))}
            </ul>
            <p className="mt-4 flex items-start gap-2 text-sm leading-relaxed text-[var(--color-muted-foreground)]">
              <Link2 className="mt-0.5 h-4 w-4 shrink-0 text-[var(--color-primary)]" aria-hidden />
              In the app, every quote links back to the original post, so you
              can check the evidence yourself.
            </p>
          </div>

          {/* Right — the idea it produced */}
          <div className="rounded-2xl border border-[var(--color-primary)]/30 bg-[var(--color-card)] p-6 shadow-[var(--shadow-card)] ring-1 ring-[var(--color-primary)]/15 sm:p-7">
            <p className="text-sm font-semibold text-[var(--color-primary)]">
              The idea Rift suggested
            </p>
            <h3 className="mt-2 text-xl font-bold tracking-tight text-[var(--color-foreground)] sm:text-2xl">
              Automatic booking reminders for independent groomers
            </h3>
            <dl className="mt-5 space-y-4">
              <div>
                <dt className="text-sm font-medium text-[var(--color-muted-foreground)]">
                  Who has the problem
                </dt>
                <dd className="mt-1 text-base leading-relaxed text-[var(--color-foreground)]/90">
                  Pet owners who book with small, independent groomers, and
                  the groomers losing money to missed appointments.
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-[var(--color-muted-foreground)]">
                  What they do today
                </dt>
                <dd className="mt-1 text-base leading-relaxed text-[var(--color-foreground)]/90">
                  Texts, paper calendars, and hope. Reminders only happen when
                  someone remembers to send them.
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-[var(--color-muted-foreground)]">
                  Idea score
                </dt>
                <dd className="mt-1 text-base leading-relaxed text-[var(--color-foreground)]/90">
                  <span className="font-semibold text-[var(--color-primary)]">
                    86 of 100
                  </span>
                  , from a fixed formula combining how often the problem
                  appears, how severe it sounds, and how consistent the
                  complaints are. The same complaints always give the same
                  score.
                </dd>
              </div>
            </dl>
          </div>
        </div>

        {/* What you'd do next */}
        <div className="mt-8 rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] p-6 sm:p-7">
          <h3 className="text-base font-semibold text-[var(--color-foreground)]">
            What you&apos;d do next
          </h3>
          <div className="mt-5 grid gap-5 sm:grid-cols-3">
            {nextActions.map((a) => (
              <div key={a.label} className="flex gap-3">
                <a.icon
                  className="mt-0.5 h-5 w-5 shrink-0 text-[var(--color-primary)]"
                  aria-hidden
                />
                <div>
                  <p className="text-base font-semibold text-[var(--color-foreground)]">
                    {a.label}
                  </p>
                  <p className="mt-1 text-sm leading-relaxed text-[var(--color-muted-foreground)]">
                    {a.text}
                  </p>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-7 flex flex-wrap items-center gap-4">
            <EurekaLink href="/sign-up" size="lg" className="rounded-full px-7">
              Try it with your own market{" "}
              <ArrowRight className="h-4 w-4" aria-hidden />
            </EurekaLink>
            <p className="text-sm text-[var(--color-muted-foreground)]">
              Free to start · No credit card required
            </p>
          </div>
        </div>
      </Container>
    </section>
  );
}
