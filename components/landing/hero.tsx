"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { motion } from "framer-motion";
import { Container } from "@/components/container";
import { Button } from "@/components/ui/button";

/* Hero — founder-approved "research cockpit" layout (July 2026 mockup):
 * huge left-aligned headline beside a browser-style product window built
 * entirely from styled divs. All window content is illustrative — no real
 * user data.
 */

const metaChips = [
  "Free during the private beta",
  "No credit card required",
  "Works with 5–10 complaints",
];

const inputs = ["Reviews", "Tickets", "Forums", "Calls"];

const quotes = [
  "“They never remind me about my appointment, so I just stopped going.”",
  "“I can't tell what grooming will actually cost until I'm there.”",
  "“Booked online and nobody ever confirmed it.”",
];

const chips = ["missed bookings", "unclear pricing", "no reminders"];

const bars = [38, 55, 44, 70, 58, 86, 64];

export function Hero() {
  return (
    <section className="relative overflow-hidden">
      {/* Background tint: a deep navy wash over the whole hero plus a
          brighter glow behind the product window */}
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
        <div
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(110% 90% at 60% 12%, rgba(30,64,175,0.28) 0%, rgba(15,32,84,0.12) 45%, transparent 75%)",
          }}
        />
        <div
          className="absolute right-0 top-0 h-[700px] w-[900px] -translate-y-1/4 translate-x-1/4 rounded-full blur-3xl"
          style={{
            background:
              "radial-gradient(ellipse at center, rgba(59,130,246,0.20) 0%, transparent 70%)",
          }}
        />
        <div
          className="absolute -bottom-40 left-0 h-[500px] w-[700px] -translate-x-1/4 rounded-full blur-3xl"
          style={{
            background:
              "radial-gradient(ellipse at center, rgba(37,99,235,0.10) 0%, transparent 70%)",
          }}
        />
      </div>

      <Container className="grid items-center gap-12 pt-16 pb-16 sm:pt-24 sm:pb-24 lg:grid-cols-2 lg:gap-10">
        {/* Left — headline block */}
        <div className="text-left">
          <motion.p
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, ease: "easeOut" }}
            className="text-[12px] font-bold uppercase tracking-[0.2em] text-[var(--color-primary)]"
          >
            Rift · Idea research from customer pain
          </motion.p>

          <motion.h1
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, ease: "easeOut", delay: 0.05 }}
            className="mt-5 text-5xl font-extrabold leading-[0.95] tracking-tight text-[var(--color-foreground)] sm:text-6xl xl:text-[5rem]"
          >
            Turn complaints into business ideas worth testing.
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, ease: "easeOut", delay: 0.1 }}
            className="mt-6 max-w-md text-lg leading-relaxed text-[var(--color-muted-foreground)]"
          >
            Type a market or paste real complaints. Rift finds repeated
            problems and turns them into ideas you can compare.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, ease: "easeOut", delay: 0.15 }}
            className="mt-8 flex flex-wrap items-center gap-3"
          >
            <Button asChild size="lg" className="rounded-lg px-6">
              <Link href="/dashboard">
                Start with a market <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button asChild variant="secondary" size="lg" className="rounded-lg px-6">
              <Link href="/#how-it-works">See how it works</Link>
            </Button>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4, delay: 0.25 }}
            className="mt-8 flex flex-wrap gap-2"
          >
            {metaChips.map((chip) => (
              <span
                key={chip}
                className="rounded-full border border-[var(--color-border)] bg-[var(--color-card)] px-3.5 py-1.5 text-xs text-[var(--color-muted-foreground)]"
              >
                {chip}
              </span>
            ))}
          </motion.div>
        </div>

        {/* Right — research-cockpit window */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: "easeOut", delay: 0.2 }}
        >
          <div className="overflow-hidden rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] text-left shadow-[var(--shadow-elevated)]">
            {/* Window chrome */}
            <div className="flex h-11 items-center gap-3 border-b border-[var(--color-border)] px-4">
              <div className="flex items-center gap-1.5" aria-hidden>
                <span className="h-2.5 w-2.5 rounded-full bg-[var(--color-danger)]/60" />
                <span className="h-2.5 w-2.5 rounded-full bg-[var(--color-warning)]/60" />
                <span className="h-2.5 w-2.5 rounded-full bg-[var(--color-success)]/60" />
              </div>
              <p className="text-xs text-[var(--color-muted-foreground)]">
                rift.app/ideas/new
              </p>
            </div>

            <div className="flex">
              {/* Inputs sidebar */}
              <div className="hidden w-36 shrink-0 border-r border-[var(--color-border)] p-3 sm:block">
                <p className="px-3 pb-2 pt-1 text-xs font-semibold text-[var(--color-foreground)]">
                  Inputs
                </p>
                {inputs.map((item) => (
                  <div
                    key={item}
                    className={`mb-1 rounded-lg px-3 py-2 text-xs ${
                      item === "Reviews"
                        ? "bg-[var(--color-surface)] font-medium text-[var(--color-foreground)]"
                        : "text-[var(--color-muted-foreground)]"
                    }`}
                  >
                    {item}
                  </div>
                ))}
              </div>

              {/* Main panel */}
              <div className="flex-1 space-y-3 p-4">
                {/* Pattern detected */}
                <div className="rounded-xl border border-[var(--color-primary)]/30 bg-[var(--color-primary)]/5 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[var(--color-primary)]">
                        Pattern detected
                      </p>
                      <p className="mt-1.5 text-sm font-semibold leading-snug text-[var(--color-foreground)]">
                        Repeated booking friction
                      </p>
                    </div>
                    <span className="shrink-0 rounded-full border border-[var(--color-primary)]/40 bg-[var(--color-primary-soft)] px-3 py-1 text-xs font-semibold text-[var(--color-primary)]">
                      92 confidence
                    </span>
                  </div>
                </div>

                {/* Complaint quotes */}
                {quotes.map((quote) => (
                  <div
                    key={quote}
                    className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3"
                  >
                    <p className="text-[13px] leading-snug text-[var(--color-foreground)]/85">
                      {quote}
                    </p>
                  </div>
                ))}

                {/* Tag chips */}
                <div className="flex flex-wrap gap-1.5">
                  {chips.map((chip) => (
                    <span
                      key={chip}
                      className="rounded-full border border-[var(--color-border)] px-2.5 py-1 text-[11px] text-[var(--color-muted-foreground)]"
                    >
                      {chip}
                    </span>
                  ))}
                </div>

                {/* Signal strength + top opportunity */}
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
                    <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[var(--color-muted-foreground)]">
                      Signal strength
                    </p>
                    <p className="mt-1 text-lg font-bold text-[var(--color-foreground)]">
                      +38%
                    </p>
                    <div className="mt-3 flex h-16 items-end gap-1.5" aria-hidden>
                      {bars.map((h, i) => (
                        <div
                          key={i}
                          className="flex-1 rounded-t-sm"
                          style={{
                            height: `${h}%`,
                            background:
                              "linear-gradient(to top, rgba(37,99,235,0.55), #3b82f6)",
                          }}
                        />
                      ))}
                    </div>
                  </div>
                  <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
                    <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[var(--color-primary)]">
                      Top opportunity
                    </p>
                    <p className="mt-1 text-sm font-semibold leading-snug text-[var(--color-foreground)]">
                      Booking reminders for groomers
                    </p>
                    <p className="mt-1.5 text-xs leading-relaxed text-[var(--color-muted-foreground)]">
                      People want confirmations before they trust a salon
                      again.
                    </p>
                  </div>
                </div>

                {/* Footer row */}
                <div className="flex items-center justify-between pt-1">
                  <p className="text-xs text-[var(--color-muted-foreground)]">
                    3 idea candidates
                  </p>
                  <span className="rounded-lg border border-[var(--color-primary)]/40 bg-[var(--color-primary-soft)] px-4 py-1.5 text-xs font-semibold text-[var(--color-primary)]">
                    Compare
                  </span>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </Container>
    </section>
  );
}
