"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowRight, Check, Maximize2, Minimize2, Pause, Play, Volume2, VolumeX } from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";
import { Container } from "@/components/container";
import { Button } from "@/components/ui/button";

/* Hero — founder-approved "research cockpit" layout (July 2026 mockup):
 * huge left-aligned headline beside a looping Remotion demo video of the
 * research cockpit (source composition: promo-video/src/HeroDemo.tsx,
 * re-encoded to public/hero-demo-v2.mp4 with a poster frame; a WebM sibling
 * saved only ~4% so H.264 ships alone — universally hardware-decoded).
 * The video is preload="none" and only starts (and therefore downloads)
 * once the hero is actually on screen, so the poster is all the initial
 * page load pays for.
 */

const metaChips = [
  "Every idea comes with receipts",
  "Searches 7 sources at once",
  "Free during the private beta",
];

/* 19 -> "0:19", 96 -> "1:36" */
function formatTime(seconds: number): string {
  const whole = Math.max(0, Math.floor(seconds));
  const m = Math.floor(whole / 60);
  const s = String(whole % 60).padStart(2, "0");
  return `${m}:${s}`;
}

export function Hero() {
  const videoWrapRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isFull, setIsFull] = useState(false);
  const [isPaused, setIsPaused] = useState(true);
  const [isMuted, setIsMuted] = useState(true);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const reduceMotion = useReducedMotion();
  const progressPct = duration > 0 ? (currentTime / duration) * 100 : 0;

  // Reduced-motion users get the poster frame, not an autoplaying loop;
  // the play button stays available if they want the demo. State is synced
  // via the video's onPlay/onPause events.
  useEffect(() => {
    if (reduceMotion) {
      videoRef.current?.pause();
    }
  }, [reduceMotion]);

  // Autoplay replacement: with preload="none" the browser downloads nothing
  // until play() is called, so start the loop the first time the hero
  // scrolls into view (never for reduced-motion users).
  useEffect(() => {
    if (reduceMotion) return;
    const v = videoRef.current;
    const wrap = videoWrapRef.current;
    if (!v || !wrap) return;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          void v.play();
          io.disconnect();
        }
      },
      { threshold: 0.25 }
    );
    io.observe(wrap);
    return () => io.disconnect();
  }, [reduceMotion]);

  // Keep state in sync when the user exits with Esc instead of the button.
  useEffect(() => {
    const onChange = () => setIsFull(Boolean(document.fullscreenElement));
    document.addEventListener("fullscreenchange", onChange);
    return () => document.removeEventListener("fullscreenchange", onChange);
  }, []);

  // The video often finishes loading metadata before React hydrates, so the
  // onLoadedMetadata prop can miss it; read the duration directly on mount.
  useEffect(() => {
    const v = videoRef.current;
    if (v && v.readyState >= 1 && Number.isFinite(v.duration)) {
      setDuration(v.duration);
    }
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

  // The demo autoplays muted (browsers require it); this lets the visitor
  // opt into the soundtrack.
  function toggleMute() {
    const v = videoRef.current;
    if (!v) return;
    v.muted = !v.muted;
    setIsMuted(v.muted);
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

      <Container className="grid items-center gap-12 pt-12 pb-12 sm:pt-24 sm:pb-24 lg:grid-cols-2 lg:gap-10">
        {/* Left — headline block */}
        <div className="text-left">
          <motion.p
            initial={{ opacity: 0, y: reduceMotion ? 0 : 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, ease: "easeOut" }}
            className="flex items-center gap-3 text-[12px] font-bold uppercase tracking-[0.12em] text-[var(--color-primary)] before:h-px before:w-8 before:bg-[var(--color-primary)]/60"
          >
            Idea research from customer pain
          </motion.p>

          <motion.h1
            initial={{ opacity: 0, y: reduceMotion ? 0 : 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, ease: "easeOut", delay: 0.05 }}
            className="mt-5 text-4xl font-extrabold leading-[1.05] tracking-tight text-[var(--color-foreground)] sm:text-6xl sm:leading-none xl:text-[5rem]"
          >
            Turn complaints into business ideas <span className="text-[var(--color-primary)]">worth testing.</span>
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
            <Button asChild size="lg" className="rounded-full px-7">
              <Link href="/sign-up">
                Start with a market <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button asChild variant="secondary" size="lg" className="rounded-full px-7">
              <Link href="/#how-it-works">See how it works</Link>
            </Button>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4, delay: 0.25 }}
            className="mt-8 flex flex-wrap gap-x-5 gap-y-2"
          >
            {metaChips.map((chip) => (
              <span
                key={chip}
                className="flex items-center gap-2 text-[13px] text-[var(--color-muted-foreground)]"
              >
                <Check
                  className="h-3.5 w-3.5 shrink-0 text-[var(--color-primary)]"
                  aria-hidden
                />
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
            className={`group relative overflow-hidden border border-blue-400/20 shadow-[var(--shadow-elevated)] ring-1 ring-white/[0.03] ${
              isFull
                ? "flex items-center justify-center rounded-none bg-black"
                : // Must match the rendered HeroDemo composition ratio
                  // (1040x1200, see promo-video/src/Root.tsx). A mismatched
                  // ratio + object-cover crops the demo to its middle band.
                  "mx-auto aspect-[13/15] w-full max-w-[520px] rounded-2xl bg-[var(--color-card)]"
            }`}
          >
            <video
              ref={videoRef}
              preload="none"
              loop
              muted
              playsInline
              onPlay={() => setIsPaused(false)}
              onPause={() => setIsPaused(true)}
              onTimeUpdate={(e) => setCurrentTime(e.currentTarget.currentTime)}
              onLoadedMetadata={(e) => setDuration(e.currentTarget.duration)}
              poster="/hero-demo-poster.jpg"
              aria-label="Demo of Rift grouping complaints into a scored idea"
              className={isFull ? "block h-full max-w-full" : "block h-full w-full object-cover"}
            >
              <source src="/hero-demo-v2.mp4" type="video/mp4" />
            </video>
            {/* Bottom control bar: play/pause, grayscale seek bar, time,
                fullscreen. Hidden until hover/focus (always shown while
                paused) so it doesn't cover the demo's own footer. */}
            <div
              className={`absolute inset-x-0 bottom-0 flex items-center gap-3 bg-gradient-to-t from-black/85 via-black/45 to-transparent px-3 pb-2.5 pt-8 transition-opacity duration-150 ease-out focus-within:pointer-events-auto focus-within:opacity-100 group-hover:pointer-events-auto group-hover:opacity-100 [@media(pointer:coarse)]:pointer-events-auto [@media(pointer:coarse)]:opacity-100 ${
                isPaused
                  ? "pointer-events-auto opacity-100"
                  : "pointer-events-none opacity-0"
              }`}
            >
              <button
                type="button"
                onClick={togglePlay}
                aria-label={isPaused ? "Play demo" : "Pause demo"}
                className="shrink-0 rounded-lg p-1.5 text-[var(--color-foreground)] transition-colors duration-150 ease-out hover:bg-[var(--color-surface)] active:scale-[0.95]"
              >
                {isPaused ? (
                  <Play className="h-4 w-4" aria-hidden />
                ) : (
                  <Pause className="h-4 w-4" aria-hidden />
                )}
              </button>
              <input
                type="range"
                min={0}
                max={duration || 0}
                step={0.1}
                value={currentTime}
                onChange={(e) => {
                  const v = videoRef.current;
                  if (!v) return;
                  v.currentTime = Number(e.target.value);
                  setCurrentTime(v.currentTime);
                }}
                aria-label="Seek through the demo"
                className="h-1 min-w-0 flex-1 cursor-pointer appearance-none rounded-full [&::-moz-range-thumb]:h-3 [&::-moz-range-thumb]:w-3 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:bg-white [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white"
                style={{
                  background: `linear-gradient(to right, #8a8a8a ${progressPct}%, #303030 ${progressPct}%)`,
                }}
              />
              <span className="shrink-0 text-[11px] tabular-nums text-white/85">
                {formatTime(currentTime)} / {formatTime(duration)}
              </span>
              <button
                type="button"
                onClick={toggleMute}
                aria-label={isMuted ? "Unmute demo" : "Mute demo"}
                className="shrink-0 rounded-lg p-1.5 text-[var(--color-foreground)] transition-colors duration-150 ease-out hover:bg-[var(--color-surface)] active:scale-[0.95]"
              >
                {isMuted ? (
                  <VolumeX className="h-4 w-4" aria-hidden />
                ) : (
                  <Volume2 className="h-4 w-4" aria-hidden />
                )}
              </button>
              <button
                type="button"
                onClick={toggleFullscreen}
                aria-label={isFull ? "Exit full screen" : "View full screen"}
                className="shrink-0 rounded-lg p-1.5 text-[var(--color-foreground)] transition-colors duration-150 ease-out hover:bg-[var(--color-surface)] active:scale-[0.95]"
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
