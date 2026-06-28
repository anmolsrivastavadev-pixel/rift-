"use client";

import Link from "next/link";
import { ArrowRight, Sparkles } from "lucide-react";
import { motion } from "framer-motion";
import { Container } from "@/components/container";
import { Button } from "@/components/ui/button";

export function Hero() {
  return (
    <section className="relative overflow-hidden">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10"
        style={{
          background:
            "radial-gradient(60% 50% at 50% 0%, rgba(37,99,235,0.18) 0%, transparent 60%)",
        }}
      />
      <Container className="py-24 sm:py-32 text-center">
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
        >
          <span className="inline-flex items-center gap-2 rounded-full border border-[var(--color-border)] bg-[var(--color-card)] px-3 py-1 text-xs text-[var(--color-muted-foreground)]">
            <Sparkles className="h-3.5 w-3.5 text-[var(--color-primary)]" />
            Opportunity intelligence for founders
          </span>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: "easeOut", delay: 0.05 }}
          className="mt-6 text-balance text-4xl font-semibold tracking-tight sm:text-5xl lg:text-6xl"
        >
          Find the business hiding in
          <br className="hidden sm:block" />{" "}
          <span className="text-[var(--color-primary)]">
            customer complaints
          </span>
          .
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: "easeOut", delay: 0.1 }}
          className="mx-auto mt-6 max-w-2xl text-balance text-base text-[var(--color-muted-foreground)] sm:text-lg"
        >
          Rift clusters real complaints with AI, summarises the underlying
          problems, and scores the strongest software opportunities — so you
          build what people already want.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: "easeOut", delay: 0.15 }}
          className="mt-10 flex items-center justify-center gap-3"
        >
          <Button asChild size="lg">
            <Link href="/dashboard">
              Open dashboard <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
          <Button asChild size="lg" variant="outline">
            <Link href="#how-it-works">How it works</Link>
          </Button>
        </motion.div>
      </Container>
    </section>
  );
}