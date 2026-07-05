"use client";

import Link from "next/link";
import { ArrowRight, Lightbulb } from "lucide-react";
import { motion } from "framer-motion";
import { Container } from "@/components/container";
import { Button } from "@/components/ui/button";

export function Hero() {
  return (
    <section className="relative overflow-hidden">
      {/* Background glow */}
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
        <div
          className="absolute left-1/2 top-0 h-[600px] w-[900px] -translate-x-1/2 -translate-y-1/3 rounded-full blur-3xl"
          style={{
            background:
              "radial-gradient(ellipse at center, rgba(59,130,246,0.15) 0%, transparent 70%)",
          }}
        />
        <div
          className="absolute -bottom-32 left-1/3 h-[400px] w-[400px] -translate-x-1/2 rounded-full blur-3xl"
          style={{
            background:
              "radial-gradient(ellipse at center, rgba(59,130,246,0.06) 0%, transparent 70%)",
          }}
        />
      </div>

      <Container className="pt-24 pb-16 sm:pt-32 sm:pb-20 text-center">
        {/* Eyebrow */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: "easeOut" }}
        >
          <span className="inline-flex items-center gap-2 rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-1.5 text-xs text-[var(--color-muted-foreground)] backdrop-blur-sm">
            <Lightbulb className="h-3.5 w-3.5 text-[var(--color-primary)]" />
            AI idea research from customer pain
          </span>
        </motion.div>

        {/* Headline */}
        <motion.h1
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: "easeOut", delay: 0.05 }}
          className="mx-auto max-w-5xl text-balance text-3xl font-semibold tracking-tight sm:text-4xl md:text-5xl lg:text-6xl leading-tight sm:leading-tight text-[var(--color-foreground)]"
        >
          Turn complaints into business ideas{" "}
          <span className="text-[var(--color-primary)]">worth testing.</span>
        </motion.h1>

        {/* Subheadline */}
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: "easeOut", delay: 0.1 }}
          className="mx-auto mt-6 max-w-2xl text-balance text-base text-[var(--color-muted-foreground)] sm:text-lg leading-relaxed"
        >
          Type a market or paste real complaints. Rift finds repeated problems
          and turns them into ideas you can compare.
        </motion.p>

        {/* CTA buttons */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: "easeOut", delay: 0.15 }}
          className="mt-10 flex flex-wrap items-center justify-center gap-3"
        >
          <Button asChild size="lg">
            <Link href="/dashboard">
              Start with a market <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </motion.div>

        {/* Trust copy */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4, delay: 0.25 }}
          className="mt-5 text-xs text-[var(--color-muted-foreground)]/70"
        >
          Free to try. No card required.
        </motion.p>

        {/* Product visual — mini workflow */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: "easeOut", delay: 0.3 }}
          className="mx-auto mt-14 max-w-2xl"
        >
          <div className="rounded-[16px] border border-[var(--color-border)] bg-[var(--color-card)]/60 p-6 backdrop-blur-sm">
            <p className="text-xs font-medium text-[var(--color-muted-foreground)] mb-4 uppercase tracking-wider">
              How it works
            </p>
            <div className="flex flex-col sm:flex-row items-stretch gap-3">
              {/* Step 1 */}
              <div className="flex-1 rounded-[12px] border border-[var(--color-border)] bg-[var(--color-background)]/60 p-4 text-left">
                <div className="flex items-center gap-2 mb-2">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[var(--color-primary)]/10 text-[10px] font-semibold text-[var(--color-primary)]">
                    1
                  </span>
                  <span className="text-xs font-medium text-[var(--color-foreground)]">Input</span>
                </div>
                <p className="text-sm text-[var(--color-muted-foreground)]">
                  &quot;dog groomers&quot; or paste real complaints
                </p>
              </div>
              {/* Arrow */}
              <div className="hidden sm:flex items-center justify-center text-[var(--color-muted-foreground)]/30">
                <ArrowRight className="h-4 w-4" />
              </div>
              <div className="flex sm:hidden items-center justify-center text-[var(--color-muted-foreground)]/30">
                <span className="rotate-90"><ArrowRight className="h-4 w-4" /></span>
              </div>
              {/* Step 2 */}
              <div className="flex-1 rounded-[12px] border border-[var(--color-border)] bg-[var(--color-background)]/60 p-4 text-left">
                <div className="flex items-center gap-2 mb-2">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[var(--color-primary)]/10 text-[10px] font-semibold text-[var(--color-primary)]">
                    2
                  </span>
                  <span className="text-xs font-medium text-[var(--color-foreground)]">Pain found</span>
                </div>
                <p className="text-sm text-[var(--color-muted-foreground)]">
                  missed bookings, unclear pricing, no reminders
                </p>
              </div>
              {/* Arrow */}
              <div className="hidden sm:flex items-center justify-center text-[var(--color-muted-foreground)]/30">
                <ArrowRight className="h-4 w-4" />
              </div>
              <div className="flex sm:hidden items-center justify-center text-[var(--color-muted-foreground)]/30">
                <span className="rotate-90"><ArrowRight className="h-4 w-4" /></span>
              </div>
              {/* Step 3 */}
              <div className="flex-1 rounded-[12px] border border-[var(--color-primary)]/30 bg-[var(--color-primary)]/5 p-4 text-left">
                <div className="flex items-center gap-2 mb-2">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[var(--color-primary)]/10 text-[10px] font-semibold text-[var(--color-primary)]">
                    3
                  </span>
                  <span className="text-xs font-medium text-[var(--color-primary)]">
                    Idea
                  </span>
                </div>
                <p className="text-sm text-[var(--color-muted-foreground)]">
                  booking + reminder tool for small grooming salons
                </p>
              </div>
            </div>
          </div>
        </motion.div>
      </Container>
    </section>
  );
}
