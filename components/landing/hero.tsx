import Link from "next/link";
import { ArrowDown, ArrowRight, Check, Lightbulb, MessagesSquare } from "lucide-react";
import { Container } from "@/components/container";
import { Button } from "@/components/ui/button";

/* Hero — beginner-first layout (July 2026 landing redesign):
 * plain-English headline and a real "type your market" input on the left,
 * and one large readable example result on the right instead of the old
 * shrunken dashboard video (the video moved to How it works as an optional
 * extra). The input is a plain GET form to /sign-up, so it works with zero
 * JavaScript; the typed market rides along as ?market=... for later use.
 * Server component — no client code needed here any more.
 */

const assurances = [
  "Sources included with every result",
  "Free during the beta",
  "No credit card required",
];

export function Hero() {
  return (
    <section className="relative overflow-hidden">
      {/* Background tint: one calm warm wash — the old spark particles and
          extra glows traded visibility for atmosphere and lost. */}
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
        <div
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(110% 90% at 60% 12%, rgba(37,99,235,0.20) 0%, rgba(23,58,138,0.10) 45%, transparent 75%)",
          }}
        />
      </div>

      <Container className="grid items-center gap-12 pt-12 pb-12 sm:pt-20 sm:pb-24 lg:grid-cols-[11fr_9fr] lg:gap-14">
        {/* Left — headline block. Entrance is CSS-only (animate-fade-up):
            the content is present and visible in server-rendered HTML, so a
            slow connection or a hydration failure still shows the headline
            and CTA. Motion is progressive enhancement, never a gate. */}
        <div className="text-left">
          <p className="animate-fade-up text-sm font-semibold text-[var(--color-primary)] sm:text-base">
            For first-time founders and side-project builders
          </p>

          <h1
            className="animate-fade-up mt-5 max-w-xl text-balance text-4xl font-extrabold leading-[1.08] tracking-tight text-[var(--color-foreground)] sm:text-5xl xl:text-6xl"
            style={{ animationDelay: "0.05s" }}
          >
            Find business ideas hidden in{" "}
            <span className="text-[var(--color-primary)]">
              real customer problems.
            </span>
          </h1>

          <p
            className="animate-fade-up mt-6 max-w-lg text-base leading-relaxed text-[var(--color-muted-foreground)] sm:text-lg"
            style={{ animationDelay: "0.1s" }}
          >
            Enter an industry or paste customer feedback. Rift groups the
            problems people keep repeating, shows you the original sources,
            and suggests practical ideas you can explore.
          </p>

          {/* The market input: a zero-JS GET form into sign-up. */}
          <form
            action="/sign-up"
            method="get"
            className="animate-fade-up mt-8 flex max-w-lg flex-col gap-3 sm:flex-row"
            style={{ animationDelay: "0.15s" }}
          >
            <label htmlFor="hero-market" className="sr-only">
              Which industry do you want ideas for?
            </label>
            <input
              id="hero-market"
              name="market"
              type="text"
              placeholder="Try “dog grooming” or “online tutoring”"
              autoComplete="off"
              className="h-12 min-w-0 flex-1 rounded-full border border-[var(--color-border)] bg-[var(--color-card)] px-5 text-base text-[var(--color-foreground)] placeholder:text-[var(--color-muted-foreground)]/80 focus:border-[var(--color-primary)]/50"
            />
            <Button type="submit" size="lg" className="shrink-0 rounded-full px-7">
              Find ideas <ArrowRight className="h-4 w-4" aria-hidden />
            </Button>
          </form>

          <p
            className="animate-fade-up mt-4 text-base"
            style={{ animationDelay: "0.2s" }}
          >
            <Link
              href="/#example"
              className="inline-flex min-h-11 items-center gap-1.5 font-medium text-[var(--color-primary)] transition-colors duration-150 ease-out hover:text-[var(--color-primary)]/75"
            >
              Or see a full example first
              <ArrowDown className="h-4 w-4" aria-hidden />
            </Link>
          </p>

          <div
            className="animate-fade-up mt-6 flex flex-wrap gap-x-5 gap-y-2"
            style={{ animationDelay: "0.25s" }}
          >
            {assurances.map((chip) => (
              <span
                key={chip}
                className="flex items-center gap-2 text-sm text-[var(--color-muted-foreground)]"
              >
                <Check
                  className="h-3.5 w-3.5 shrink-0 text-[var(--color-primary)]"
                  aria-hidden
                />
                {chip}
              </span>
            ))}
          </div>
        </div>

        {/* Right — the transformation, readable at arm's length: what you
            type becomes a problem with evidence becomes an idea. One copper
            thread joins the three beats. This is the page's one signature
            element; everything else stays quiet. */}
        <div className="animate-fade-up" style={{ animationDelay: "0.2s" }}>
          <div className="relative mx-auto w-full max-w-md rounded-2xl border border-[#3b82f6]/20 bg-[var(--color-card)] p-6 shadow-[var(--shadow-elevated)] ring-1 ring-white/[0.03] sm:p-7">
            <p className="text-xs font-semibold uppercase tracking-wide text-[var(--color-muted-foreground)]">
              Example — what one result looks like
            </p>

            {/* Beat 1: the input */}
            <div className="mt-5">
              <p className="text-sm font-medium text-[var(--color-muted-foreground)]">
                You type
              </p>
              <div className="mt-2 rounded-xl border border-[var(--color-border)] bg-[var(--color-background)] px-4 py-3 text-base font-medium text-[var(--color-foreground)]">
                dog grooming
              </div>
            </div>

            {/* Thread */}
            <div aria-hidden className="ml-5 h-6 w-px bg-gradient-to-b from-transparent via-[#3b82f6]/50 to-[#3b82f6]/50" />

            {/* Beat 2: the repeated problem, with evidence */}
            <div>
              <p className="flex items-center gap-2 text-sm font-medium text-[var(--color-muted-foreground)]">
                <MessagesSquare className="h-4 w-4 text-[var(--color-primary)]" aria-hidden />
                Rift finds a problem people repeat
              </p>
              <div className="mt-2 rounded-xl border border-[var(--color-border)] bg-[var(--color-background)] px-4 py-3.5">
                <p className="text-base font-semibold text-[var(--color-foreground)]">
                  Customers keep missing their appointments
                </p>
                <p className="mt-1.5 text-sm leading-relaxed text-[var(--color-muted-foreground)]">
                  “Nobody reminded me about my appointment, so I forgot.
                  Again.”
                </p>
                <p className="mt-2 text-sm text-[var(--color-muted-foreground)]">
                  11 complaints · each one links to the original post
                </p>
              </div>
            </div>

            {/* Thread */}
            <div aria-hidden className="ml-5 h-6 w-px bg-[#3b82f6]/50" />

            {/* Beat 3: the idea */}
            <div>
              <p className="flex items-center gap-2 text-sm font-medium text-[var(--color-muted-foreground)]">
                <Lightbulb className="h-4 w-4 text-[var(--color-primary)]" aria-hidden />
                …and suggests an idea to explore
              </p>
              <div className="mt-2 rounded-xl border border-[var(--color-primary)]/35 bg-[var(--color-primary-soft)] px-4 py-3.5">
                <p className="text-base font-semibold text-[var(--color-foreground)]">
                  Automatic booking reminders for independent groomers
                </p>
                <p className="mt-1.5 text-sm leading-relaxed text-[var(--color-muted-foreground)]">
                  Idea score 86 of 100 — based on how often the problem
                  appears, how severe it sounds, and how consistent the
                  complaints are.
                </p>
              </div>
            </div>

            <p className="mt-5 text-xs leading-relaxed text-[var(--color-muted-foreground)]">
              Sample data. Your results are built from real complaints in
              your market.
            </p>
          </div>
        </div>
      </Container>
    </section>
  );
}
