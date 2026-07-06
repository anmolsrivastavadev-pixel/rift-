"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowRight, Maximize2, Minimize2, Pause, Play } from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";
import { Container } from "@/components/container";
import { Button } from "@/components/ui/button";

/* Hero — founder-approved "research cockpit" layout (July 2026 mockup):
 * huge left-aligned headline beside a looping Remotion demo video of the
 * research cockpit (source composition: promo-video/src/HeroDemo.tsx,
 * rendered to public/hero-demo.mp4 with a poster frame for slow loads).
 */

const metaChips = [
  "Free during the private beta",
  "No credit card required",
  "Works with 5–10 complaints",
];

export function Hero() {
  const videoWrapRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isFull, setIsFull] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const reduceMotion = useReducedMotion();

  // Reduced-motion users get the poster frame, not an autoplaying loop;
  // the play button stays available if they want the demo. State is synced
  // via the video's onPlay/onPause events.
  useEffect(() => {
    if (reduceMotion) {
      videoRef.current?.pause();
    }
  }, [reduceMotion]);

  // Keep state in sync when the user exits with Esc instead of the button.
  useEffect(() => {
    const onChange = () => setIsFull(Boolean(document.fullscreenElement));
    document.addEventListener("fullscreenchange", onChange);
    return () => document.removeEventListener("fullscreenchange", onChange);
  }, []);

  async function toggleFullscreen() {
    const el = videoWrapRef.current;
    if (!el) return;
    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen();
      } else {
        await el.requestFullscreen();
      }
    } catch {
      // Fullscreen unsupported or blocked: leave the inline video as is.
    }
  }

  function togglePlay() {
    const v = videoRef.current;
    if (!v) return;
    if (v.paused) {
      void v.play();
    } else {
      v.pause();
    }
  }

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
            initial={{ opacity: 0, y: reduceMotion ? 0 : 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, ease: "easeOut" }}
            className="text-[12px] font-bold uppercase tracking-[0.08em] text-[var(--color-muted-foreground)]"
          >
            Idea research from customer pain
          </motion.p>

          <motion.h1
            initial={{ opacity: 0, y: reduceMotion ? 0 : 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, ease: "easeOut", delay: 0.05 }}
            className="mt-5 text-5xl font-extrabold leading-none tracking-tight text-[var(--color-foreground)] sm:text-6xl xl:text-[5rem]"
          >
            Turn complaints into business ideas worth testing.
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: reduceMotion ? 0 : 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, ease: "easeOut", delay: 0.1 }}
            className="mt-6 max-w-md text-lg leading-relaxed text-[var(--color-muted-foreground)]"
          >
            Type a market or paste real complaints. Rift finds repeated
            problems and turns them into ideas you can compare.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: reduceMotion ? 0 : 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, ease: "easeOut", delay: 0.15 }}
            className="mt-8 flex flex-wrap items-center gap-3"
          >
            <Button asChild size="lg" className="rounded-lg px-6">
              <Link href="/sign-up">
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

        {/* Right — research-cockpit demo video (Remotion) */}
        <motion.div
          initial={{ opacity: 0, y: reduceMotion ? 0 : 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: "easeOut", delay: 0.2 }}
        >
          <div
            ref={videoWrapRef}
            className={`relative overflow-hidden border border-[var(--color-border)] shadow-[var(--shadow-elevated)] ${
              isFull
                ? "flex items-center justify-center rounded-none bg-black"
                : "rounded-2xl bg-[var(--color-card)]"
            }`}
          >
            <video
              ref={videoRef}
              autoPlay
              loop
              muted
              playsInline
              onPlay={() => setIsPaused(false)}
              onPause={() => setIsPaused(true)}
              poster="/hero-demo-poster.jpg"
              aria-label="Demo of Rift grouping complaints into a scored idea"
              className={isFull ? "block h-full max-w-full" : "block h-auto w-full"}
            >
              <source src="/hero-demo.mp4" type="video/mp4" />
            </video>
            {/* Minimal control strip, styled like native video controls */}
            <div className="absolute bottom-3 right-3 flex items-center gap-0.5 rounded-xl border border-[var(--color-border)] bg-black/75 p-1 opacity-85 backdrop-blur-sm transition-opacity duration-150 ease-out hover:opacity-100">
              <button
                type="button"
                onClick={togglePlay}
                aria-label={isPaused ? "Play demo" : "Pause demo"}
                className="rounded-lg p-2 text-[var(--color-foreground)] transition-colors duration-150 ease-out hover:bg-[var(--color-surface)] active:scale-[0.95]"
              >
                {isPaused ? (
                  <Play className="h-4 w-4" aria-hidden />
                ) : (
                  <Pause className="h-4 w-4" aria-hidden />
                )}
              </button>
              <button
                type="button"
                onClick={toggleFullscreen}
                aria-label={isFull ? "Exit full screen" : "View full screen"}
                className="rounded-lg p-2 text-[var(--color-foreground)] transition-colors duration-150 ease-out hover:bg-[var(--color-surface)] active:scale-[0.95]"
              >
                {isFull ? (
                  <Minimize2 className="h-4 w-4" aria-hidden />
                ) : (
                  <Maximize2 className="h-4 w-4" aria-hidden />
                )}
              </button>
            </div>
          </div>
        </motion.div>
      </Container>
    </section>
  );
}
