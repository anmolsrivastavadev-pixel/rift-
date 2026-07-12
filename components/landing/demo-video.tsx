"use client";

import { useEffect, useRef, useState } from "react";
import { Maximize2, Minimize2, Pause, Play, Volume2, VolumeX } from "lucide-react";

/* Optional product demo (July 2026 landing redesign): the looping Remotion
 * research-cockpit video that used to BE the hero, now offered as an extra
 * beside the How-it-works steps — the static page must explain Rift on its
 * own. Source composition: promo-video/src/HeroDemo.tsx, re-encoded to
 * public/hero-demo-v3.mp4 with a poster frame. (Version the filenames on
 * every re-render — browsers cache the mp4 hard, so a same-name replace
 * keeps serving old copies to returning visitors.)
 *
 * The video is preload="none" and only starts (and therefore downloads)
 * once it is actually on screen, so the poster is all the initial page
 * load pays for. Reduced-motion users get the poster and a play button.
 */

/* 19 -> "0:19", 96 -> "1:36" */
function formatTime(seconds: number): string {
  const whole = Math.max(0, Math.floor(seconds));
  const m = Math.floor(whole / 60);
  const s = String(whole % 60).padStart(2, "0");
  return `${m}:${s}`;
}

export function DemoVideo() {
  const videoWrapRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isFull, setIsFull] = useState(false);
  const [isPaused, setIsPaused] = useState(true);
  const [isMuted, setIsMuted] = useState(true);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [reduceMotion, setReduceMotion] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    // eslint-disable-next-line react-hooks/set-state-in-effect -- media query is client-only
    setReduceMotion(mq.matches);
    const onChange = () => setReduceMotion(mq.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);
  const progressPct = duration > 0 ? (currentTime / duration) * 100 : 0;

  // Reduced-motion users get the poster frame, not an autoplaying loop;
  // the play button stays available if they want the demo.
  useEffect(() => {
    if (reduceMotion) {
      videoRef.current?.pause();
    }
  }, [reduceMotion]);

  // Autoplay replacement: with preload="none" the browser downloads nothing
  // until play() is called, so start the loop the first time the panel
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

  // The demo plays muted (browsers require it); this lets the visitor
  // opt into the soundtrack.
  function toggleMute() {
    const v = videoRef.current;
    if (!v) return;
    v.muted = !v.muted;
    setIsMuted(v.muted);
  }

  return (
    <div
      ref={videoWrapRef}
      className={`group relative overflow-hidden border-2 border-[#3a3245]/30 shadow-[var(--shadow-elevated)] ${
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
        poster="/hero-demo-poster-v3.jpg"
        aria-label="Demo of Rift grouping complaints into a scored idea"
        className={isFull ? "block h-full max-w-full" : "block h-full w-full object-cover"}
      >
        <source src="/hero-demo-v3.mp4" type="video/mp4" />
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
          className="shrink-0 rounded-lg p-1.5 text-white/90 transition-colors duration-150 ease-out hover:bg-white/15 hover:text-white active:scale-[0.95]"
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
        {duration > 0 && (
          <span className="shrink-0 text-xs tabular-nums text-white/85">
            {formatTime(currentTime)} / {formatTime(duration)}
          </span>
        )}
        <button
          type="button"
          onClick={toggleMute}
          aria-label={isMuted ? "Unmute demo" : "Mute demo"}
          className="shrink-0 rounded-lg p-1.5 text-white/90 transition-colors duration-150 ease-out hover:bg-white/15 hover:text-white active:scale-[0.95]"
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
          className="shrink-0 rounded-lg p-1.5 text-white/90 transition-colors duration-150 ease-out hover:bg-white/15 hover:text-white active:scale-[0.95]"
        >
          {isFull ? (
            <Minimize2 className="h-4 w-4" aria-hidden />
          ) : (
            <Maximize2 className="h-4 w-4" aria-hidden />
          )}
        </button>
      </div>
    </div>
  );
}
