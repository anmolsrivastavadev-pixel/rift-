import Link from "next/link";
import {
  ArrowDown,
  ArrowRight,
  ArrowUpRight,
  Check,
  Inbox,
  Lightbulb,
  MessagesSquare,
  Sparkles,
} from "lucide-react";

import { Container } from "@/components/container";
import { Button } from "@/components/ui/button";
import { RiftMark } from "@/components/logo";
import { EurekaForm, EurekaLink } from "@/components/landing/eureka";
import { HowItWorks } from "@/components/landing/how-it-works";
import { ExampleWalkthrough } from "@/components/landing/example-walkthrough";
import { Trust } from "@/components/landing/trust";
import { ChatgptCompare } from "@/components/landing/chatgpt-compare";
import { Faq } from "@/components/landing/faq";
import { Footer } from "@/components/landing/footer";
import { MobileMenu } from "@/components/landing/mobile-menu";

/* Doodle landing page (July 2026 founder-picked redesign). Warm cream
 * paper, coral CTAs, dark plum ink, rounded display type, tilted pastel
 * sticker cards — after a playful reference the founder chose. The palette
 * and fonts are the site-wide tokens (globals.css / app/layout.tsx); this
 * file adds the landing-only chrome: nav, hero, evidence map, CTA band.
 * Rendered by both "/" (the real landing page) and "/redesign" (the
 * unlinked, noindexed preview alias). DoodleNav is shared with the
 * pricing and legal pages.
 */

/* Accent used by the hand-drawn chrome (badge, swoosh). The ink for
 * borders and offset shadows is written inline as #3a3245 — it mirrors
 * --color-foreground in globals.css. */
const YELLOW = "#ffc53d";

const heroAssurances = [
  "Sources included with every result",
  "Free during the beta",
  "No credit card required",
];

/* Coral pill with the ink "sticker edge" under it. Composes with the
 * token-driven primary Button fill, so only radius + shadow change. */
const stickerCta =
  "rounded-full border-2 border-[#3a3245] shadow-[0_4px_0_#3a3245] hover:shadow-[0_4px_0_#3a3245] hover:brightness-105";

const navLinks = [
  { href: "/#how-it-works", label: "How it works" },
  { href: "/#example", label: "Example" },
  { href: "/pricing", label: "Pricing" },
  { href: "/#faq", label: "FAQ" },
];

export function DoodleNav() {
  return (
    <header className="sticky top-0 z-50 bg-[#fdf1e3]/85 backdrop-blur-xl">
      <div className="relative mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link
          href="/"
          className="flex items-center gap-2 text-xl font-extrabold tracking-tight"
          style={{ fontFamily: "var(--font-display)" }}
        >
          <RiftMark size={30} id="doodle-nav-mark" />
          Rift
          <span aria-hidden className="-ml-1.5 text-[var(--color-primary)]">
            .
          </span>
        </Link>

        <nav aria-label="Main" className="hidden items-center gap-1 md:flex">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="rounded-full px-3.5 py-2 text-sm font-bold text-[var(--color-foreground)]/80 transition-colors duration-150 ease-out hover:bg-[var(--color-surface)] hover:text-[var(--color-foreground)]"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2.5">
          <Button
            asChild
            variant="ghost"
            size="sm"
            className="hidden rounded-full sm:inline-flex"
          >
            <Link href="/sign-in">Sign in</Link>
          </Button>
          <EurekaLink href="/sign-up" size="sm" className={`${stickerCta} px-5`}>
            Try free <ArrowUpRight className="h-3.5 w-3.5" />
          </EurekaLink>
          <MobileMenu links={navLinks} />
        </div>
      </div>
    </header>
  );
}

/* The four hero stickers: one real artifact from each step of the product
 * story (complaint → sources → idea → momentum), scattered like notes on
 * a fridge door. Rotation lives on the wrapper and fade-up on the inner
 * card so the entrance animation can't overwrite the tilt. */
const heroStickers = [
  {
    icon: MessagesSquare,
    bg: "#dcecfd",
    tilt: "-rotate-6",
    nudge: "mt-6",
    delay: "0.25s",
    title: "“Nobody reminded me about my appointment. Again.”",
    caption: "1 of 11 complaints · dog grooming",
  },
  {
    icon: Inbox,
    bg: "#ece6fb",
    tilt: "rotate-3",
    nudge: "",
    delay: "0.35s",
    title: "7 places, searched at once",
    caption: "Reddit, app reviews, Hacker News & more",
  },
  {
    icon: Lightbulb,
    bg: "#ddf3e4",
    tilt: "rotate-2",
    nudge: "-mt-2",
    delay: "0.45s",
    title: "Automatic booking reminders",
    caption: "Idea score 86 / 100 — explained, never a black box",
  },
  {
    icon: Sparkles,
    bg: "#fde3d6",
    tilt: "-rotate-3",
    nudge: "mt-4",
    delay: "0.55s",
    title: "+12 ideas",
    caption: "found in real posts this week",
  },
];

function DoodleHero() {
  return (
    <section className="relative overflow-hidden">
      <Container className="grid items-center gap-14 pt-12 pb-16 sm:pt-16 sm:pb-24 lg:grid-cols-[11fr_9fr] lg:gap-16">
        <div className="text-left">
          <span
            className="animate-fade-up inline-flex items-center gap-2 rounded-full border-2 border-[#3a3245] px-4 py-1.5 text-sm font-bold text-[#3a3245] shadow-[0_3px_0_#3a3245]"
            style={{ backgroundColor: YELLOW }}
          >
            <Sparkles className="h-4 w-4" aria-hidden />
            For first-time founders
          </span>

          <h1
            className="animate-fade-up mt-6 max-w-xl text-balance text-4xl font-extrabold leading-[1.12] text-[var(--color-foreground)] sm:text-5xl xl:text-[3.5rem]"
            style={{ animationDelay: "0.05s" }}
          >
            Find business ideas hidden in real customer{" "}
            <span className="relative inline-block">
              problems.
              <svg
                aria-hidden
                className="doodle-swoosh absolute -bottom-1.5 left-0 h-3.5 w-full"
                viewBox="0 0 300 14"
                fill="none"
                preserveAspectRatio="none"
              >
                <path
                  d="M5 10.5C68 4.5 158 3 295 7.5"
                  stroke={YELLOW}
                  strokeWidth="8"
                  strokeLinecap="round"
                />
              </svg>
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

          <EurekaForm
            action="/sign-up"
            method="get"
            className="animate-fade-up mt-8 flex max-w-lg flex-col gap-3 sm:flex-row"
            style={{ animationDelay: "0.15s" }}
          >
            <label htmlFor="doodle-hero-market" className="sr-only">
              Which industry do you want ideas for?
            </label>
            <input
              id="doodle-hero-market"
              name="market"
              type="text"
              placeholder="Try “dog grooming” or “online tutoring”"
              autoComplete="off"
              className="h-13 min-w-0 flex-1 rounded-full border-2 border-[#3a3245]/30 bg-white px-5 py-3 text-base font-semibold text-[var(--color-foreground)] shadow-[var(--shadow-card)] placeholder:font-medium placeholder:text-[var(--color-muted-foreground)] focus:border-[#3a3245]"
            />
            <Button type="submit" size="lg" className={`${stickerCta} shrink-0 px-7`}>
              Find ideas <ArrowRight className="h-4 w-4" aria-hidden />
            </Button>
          </EurekaForm>

          <p
            className="animate-fade-up mt-5 text-base"
            style={{ animationDelay: "0.2s" }}
          >
            <Link
              href="/#example"
              className="inline-flex min-h-11 items-center gap-1.5 font-bold text-[var(--color-primary)] transition-colors duration-150 ease-out hover:text-[var(--color-primary)]/75"
            >
              Or see a full example first
              <ArrowDown className="h-4 w-4" aria-hidden />
            </Link>
          </p>

          <div
            className="animate-fade-up mt-6 flex flex-wrap gap-x-5 gap-y-2"
            style={{ animationDelay: "0.25s" }}
          >
            {heroAssurances.map((chip) => (
              <span
                key={chip}
                className="flex items-center gap-2 text-sm font-semibold text-[var(--color-muted-foreground)]"
              >
                <Check
                  className="h-4 w-4 shrink-0 text-[var(--color-success)]"
                  strokeWidth={3}
                  aria-hidden
                />
                {chip}
              </span>
            ))}
          </div>
        </div>

        <div className="mx-auto grid w-full max-w-md grid-cols-2 gap-5 sm:gap-6 lg:max-w-none">
          {heroStickers.map((s) => (
            <div
              key={s.title}
              className={`${s.tilt} ${s.nudge} transition-transform duration-300 ease-out hover:rotate-0`}
            >
              <div
                className="animate-fade-up rounded-2xl border-2 border-[#3a3245]/80 p-5 shadow-[0_10px_24px_rgba(58,50,69,0.14)]"
                style={{ backgroundColor: s.bg, animationDelay: s.delay }}
              >
                <span className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-[#3a3245]/80 bg-white/80 text-[#3a3245]">
                  <s.icon className="h-5 w-5" aria-hidden />
                </span>
                <p className="mt-3.5 text-base font-extrabold leading-snug text-[#3a3245]">
                  {s.title}
                </p>
                <p className="mt-1.5 text-sm font-semibold leading-relaxed text-[#5f5569]">
                  {s.caption}
                </p>
              </div>
            </div>
          ))}
          <p className="col-span-2 text-center text-xs font-semibold text-[var(--color-muted-foreground)]">
            Sample data. Your results are built from real complaints in your
            market.
          </p>
        </div>
      </Container>
    </section>
  );
}

const sourceNodes = [
  { label: "The web", className: "left-1/2 top-[6%] -translate-x-1/2", tilt: "-rotate-2", bg: "#dcecfd" },
  { label: "App reviews", className: "left-[7%] top-[13%]", tilt: "rotate-3", bg: "#fde3d6" },
  { label: "GitHub issues", className: "left-[4%] top-[46%]", tilt: "-rotate-3", bg: "#ddf3e4" },
  { label: "YouTube comments", className: "left-[14%] bottom-[10%]", tilt: "rotate-2", bg: "#ece6fb" },
  { label: "Reddit posts", className: "right-[7%] top-[15%]", tilt: "rotate-3", bg: "#ddf3e4" },
  { label: "Hacker News", className: "right-[4%] top-[47%]", tilt: "-rotate-2", bg: "#fde3d6" },
  { label: "Stack Exchange", className: "right-[12%] bottom-[11%]", tilt: "rotate-2", bg: "#dcecfd" },
];

function DoodleEvidenceMap() {
  return (
    <section id="sources" className="scroll-mt-24 py-20 sm:py-28">
      <Container className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
        <div>
          <p className="flex items-center gap-2 text-sm font-bold text-[var(--color-primary)]">
            <Inbox className="h-4 w-4" aria-hidden />
            Where the evidence comes from
          </p>
          <h2 className="mt-5 text-balance text-3xl font-bold text-[var(--color-foreground)] sm:text-4xl">
            Seven places founders find problems,{" "}
            <span className="text-[var(--color-primary)]">searched at once.</span>
          </h2>
          <p className="mt-4 text-base leading-relaxed text-[var(--color-muted-foreground)] sm:text-lg">
            When you type a market, Rift searches these seven places for real
            customer complaints. You can also paste your own reviews, support
            messages, or a spreadsheet. Everything lands in one project and
            feeds one set of scored ideas.
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            <EurekaLink href="/sign-up" className={`${stickerCta} px-6`}>
              Try Rift free
            </EurekaLink>
            <Button
              asChild
              variant="outline"
              className="rounded-full border-2 border-[#3a3245]/30 bg-transparent px-6 hover:border-[#3a3245] hover:bg-[var(--color-card)]"
            >
              <Link href="/#faq">Read the FAQ</Link>
            </Button>
          </div>
        </div>

        {/* Fridge-door map: paper panel, hand-drawn dashed edge, tilted
            pastel source stickers around the Rift badge */}
        <div className="relative overflow-hidden rounded-[2rem] border-2 border-dashed border-[#3a3245]/30 bg-[var(--color-card)] sm:min-h-[440px]">
          <div className="relative mx-auto mt-8 flex h-32 w-32 flex-col items-center justify-center gap-1.5 rounded-3xl border-2 border-[#3a3245] bg-white shadow-[0_5px_0_#3a3245] sm:absolute sm:left-1/2 sm:top-1/2 sm:mt-0 sm:-translate-x-1/2 sm:-translate-y-1/2">
            <RiftMark size={44} id="doodle-evidence-mark" />
            <span
              className="text-sm font-extrabold text-[#3a3245]"
              style={{ fontFamily: "var(--font-display)" }}
            >
              Rift
            </span>
          </div>
          {sourceNodes.map((node) => (
            <div key={node.label} className={`absolute hidden sm:block ${node.className} ${node.tilt}`}>
              <span
                className="block rounded-xl border-2 border-[#3a3245]/80 px-4 py-2.5 text-xs font-extrabold text-[#3a3245] shadow-[0_6px_14px_rgba(58,50,69,0.12)]"
                style={{ backgroundColor: node.bg }}
              >
                {node.label}
              </span>
            </div>
          ))}
          <div className="flex flex-wrap justify-center gap-2.5 p-6 sm:hidden">
            {sourceNodes.map((node) => (
              <span
                key={node.label}
                className={`rounded-xl border-2 border-[#3a3245]/80 px-4 py-2.5 text-xs font-extrabold text-[#3a3245] ${node.tilt}`}
                style={{ backgroundColor: node.bg }}
              >
                {node.label}
              </span>
            ))}
          </div>
        </div>
      </Container>
    </section>
  );
}

const ctaAssurances = [
  "Free during the beta",
  "Works with just 5–10 pasted comments",
  "No credit card required",
];

function DoodleCtaBand() {
  return (
    <section className="pb-20 sm:pb-24">
      <Container>
        {/* One big coral sticker instead of a full-bleed band */}
        <div className="flex flex-col items-start gap-6 rounded-[2.5rem] border-2 border-[#3a3245] bg-[#cf4318] px-7 py-10 shadow-[0_6px_0_#3a3245] sm:px-10 sm:py-12 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-2xl font-bold text-white sm:text-3xl">
              Ready to find your first idea?
            </h2>
            <ul className="mt-4 flex flex-wrap gap-x-6 gap-y-2">
              {ctaAssurances.map((item) => (
                <li
                  key={item}
                  className="flex items-center gap-2 text-sm font-semibold text-white"
                >
                  <Check className="h-4 w-4 text-white" strokeWidth={3} aria-hidden />
                  {item}
                </li>
              ))}
            </ul>
          </div>
          {/* Inverted CTA: cream button on the coral sticker */}
          <EurekaLink
            href="/sign-up"
            size="lg"
            className="shrink-0 rounded-full border-2 border-[#3a3245] bg-none bg-[#fdf1e3] px-7 text-[#3a3245] shadow-[0_4px_0_#3a3245] hover:bg-white hover:shadow-[0_4px_0_#3a3245] hover:brightness-100"
          >
            Find my first idea <ArrowRight className="h-4 w-4" aria-hidden />
          </EurekaLink>
        </div>
      </Container>
    </section>
  );
}

export function DoodleLanding() {
  return (
    <main id="main-content" className="min-h-screen">
      <DoodleNav />
      <DoodleHero />
      <HowItWorks />
      <ExampleWalkthrough />
      <DoodleEvidenceMap />
      <Trust />
      <ChatgptCompare />
      <Faq />
      <DoodleCtaBand />
      <Footer />
    </main>
  );
}
