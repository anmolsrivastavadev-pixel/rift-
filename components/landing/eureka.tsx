"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Lightbulb } from "lucide-react";

import { Button, type ButtonProps } from "@/components/ui/button";

/* Eureka burst — the landing page's celebration moment (founder sketch,
 * July 2026): clicking a journey-starting button ("Find ideas", "Try free",
 * "Find my first idea", ...) pops a fan of tiny golden lightbulbs out of the
 * button, flickering on like real filaments — the visitor just had their
 * business-idea eureka moment. The page pauses ~half a second so the burst
 * always plays, then navigation proceeds.
 *
 * Behavior notes:
 * - The overlay is portalled to <body>: the nav pill's backdrop-blur creates
 *   a containing block that would trap/misplace `position: fixed` children,
 *   and the mobile-menu panel unmounts on close.
 * - Reduced motion, modified clicks (new-tab), and repeat clicks while a
 *   burst is pending all fall through to normal, instant navigation.
 * - The hero form keeps its zero-JS GET semantics: without JS it submits
 *   natively; with JS we pause, then call the same native submit.
 */

const NAV_DELAY_MS = 560;
/* Clear the burst after it finishes so the same button can fire again —
 * without this, a bfcache Back-restore (or an aborted navigation) leaves the
 * "burst pending" state stuck and every later click skips the animation. */
const RESET_MS = 900;

/* Upward fan of five bulbs: angle (deg, -90 = straight up), distance (px),
 * icon size (px), start delay (ms). Middle bulb leads, edges trail. */
const BULBS = [
  { a: -152, d: 52, s: 13, t: 70 },
  { a: -119, d: 66, s: 17, t: 25 },
  { a: -90, d: 74, s: 20, t: 0 },
  { a: -61, d: 66, s: 15, t: 40 },
  { a: -28, d: 52, s: 13, t: 85 },
];

function prefersReducedMotion() {
  return (
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

type Burst = { x: number; y: number };

/* "light" (default) tunes the bulbs for the cream site: deeper amber +
 * stronger glow so they read on paper. "dark" is the bright-yellow variant
 * kept for any future dark surface. The tone rides on the overlay's own
 * class because the portal renders on <body>, outside any page-level theme
 * wrapper. */
export type EurekaTone = "dark" | "light";

const EurekaToneContext = React.createContext<EurekaTone>("light");

/* Wrap a whole page (e.g. /redesign) to default every burst inside it to a
 * tone without threading props into each button. */
export function EurekaToneProvider({
  tone,
  children,
}: {
  tone: EurekaTone;
  children: React.ReactNode;
}) {
  return (
    <EurekaToneContext.Provider value={tone}>
      {children}
    </EurekaToneContext.Provider>
  );
}

function useEureka(tone?: EurekaTone) {
  const contextTone = React.useContext(EurekaToneContext);
  const resolvedTone = tone ?? contextTone;
  const [burst, setBurst] = React.useState<Burst | null>(null);
  const timer = React.useRef<number | null>(null);
  const resetTimer = React.useRef<number | null>(null);

  React.useEffect(() => {
    /* Back-button returns often restore this page from the browser's
     * back/forward cache with the old JS state intact, mid-burst flag
     * included. Reset so the buttons celebrate every visit. */
    const onPageShow = (e: PageTransitionEvent) => {
      if (e.persisted) setBurst(null);
    };
    window.addEventListener("pageshow", onPageShow);
    return () => {
      window.removeEventListener("pageshow", onPageShow);
      if (timer.current !== null) window.clearTimeout(timer.current);
      if (resetTimer.current !== null) window.clearTimeout(resetTimer.current);
    };
  }, []);

  /* Returns true when the burst was started and the caller should
   * preventDefault; false means "navigate normally, right now". */
  const fire = React.useCallback(
    (anchor: Element | null, then: () => void) => {
      if (burst || prefersReducedMotion()) return false;
      const rect = anchor?.getBoundingClientRect();
      if (!rect) return false;
      setBurst({ x: rect.left + rect.width / 2, y: rect.top + 4 });
      timer.current = window.setTimeout(then, NAV_DELAY_MS);
      resetTimer.current = window.setTimeout(() => setBurst(null), RESET_MS);
      return true;
    },
    [burst]
  );

  const overlay = burst
    ? createPortal(
        <span
          aria-hidden
          className={
            resolvedTone === "light"
              ? "eureka-burst eureka-burst--light"
              : "eureka-burst"
          }
          style={{ left: burst.x, top: burst.y }}
        >
          <span className="eureka-flash" />
          {BULBS.map((b, i) => {
            const rad = (b.a * Math.PI) / 180;
            return (
              <span
                key={i}
                className="eureka-bulb"
                style={
                  {
                    "--tx": `${Math.cos(rad) * b.d}px`,
                    "--ty": `${Math.sin(rad) * b.d}px`,
                    animationDelay: `${b.t}ms`,
                  } as React.CSSProperties
                }
              >
                <Lightbulb
                  style={{ width: b.s, height: b.s }}
                  strokeWidth={2.25}
                />
              </span>
            );
          })}
        </span>,
        document.body
      )
    : null;

  return { fire, overlay };
}

function isModifiedClick(e: React.MouseEvent) {
  return e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0;
}

/* A Button-styled Link that plays the burst, then navigates. */
export function EurekaLink({
  href,
  children,
  className,
  size,
  variant,
  tone,
}: {
  href: string;
  children: React.ReactNode;
  className?: string;
  size?: ButtonProps["size"];
  variant?: ButtonProps["variant"];
  tone?: EurekaTone;
}) {
  const router = useRouter();
  const { fire, overlay } = useEureka(tone);

  return (
    <>
      <Button asChild size={size} variant={variant} className={className}>
        <Link
          href={href}
          onClick={(e) => {
            if (isModifiedClick(e)) return;
            if (fire(e.currentTarget, () => router.push(href))) {
              e.preventDefault();
            }
          }}
        >
          {children}
        </Link>
      </Button>
      {overlay}
    </>
  );
}

/* Same idea for a plain-styled link (mobile menu "Start free"). */
export function EurekaMenuLink({
  href,
  className,
  children,
  tone,
}: {
  href: string;
  className?: string;
  children: React.ReactNode;
  tone?: EurekaTone;
}) {
  const router = useRouter();
  const { fire, overlay } = useEureka(tone);

  return (
    <>
      <Link
        href={href}
        className={className}
        onClick={(e) => {
          if (isModifiedClick(e)) return;
          if (fire(e.currentTarget, () => router.push(href))) {
            e.preventDefault();
          }
        }}
      >
        {children}
      </Link>
      {overlay}
    </>
  );
}

/* Wrapper for the hero's zero-JS GET form: pause for the burst, then run the
 * same native submit the form would have done anyway. */
export function EurekaForm({
  action,
  method,
  className,
  style,
  children,
  tone,
}: {
  action: string;
  method: string;
  className?: string;
  style?: React.CSSProperties;
  children: React.ReactNode;
  tone?: EurekaTone;
}) {
  const { fire, overlay } = useEureka(tone);

  return (
    <>
      <form
        action={action}
        method={method}
        className={className}
        style={style}
        onSubmit={(e) => {
          const form = e.currentTarget;
          const anchor =
            form.querySelector('button[type="submit"]') ?? form;
          if (fire(anchor, () => form.submit())) e.preventDefault();
        }}
      >
        {children}
      </form>
      {overlay}
    </>
  );
}
