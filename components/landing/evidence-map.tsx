import Link from "next/link";
import { Inbox } from "lucide-react";
import { Container } from "@/components/container";
import { Button } from "@/components/ui/button";
import { EurekaLink } from "@/components/landing/eureka";
import { RiftMark } from "@/components/logo";

/* "Bring your own evidence" section: complaint sources orbiting the Rift
 * mark, connected by faint lines. Built from positioned divs, no images.
 */

const nodes = [
  { label: "The web", className: "left-1/2 top-[5%] -translate-x-1/2" },
  { label: "App reviews", className: "left-[8%] top-[12%]" },
  { label: "GitHub issues", className: "left-[4%] top-[45%]" },
  { label: "YouTube comments", className: "left-[16%] bottom-[10%]" },
  { label: "Reddit posts", className: "right-[8%] top-[14%]" },
  { label: "Hacker News", className: "right-[4%] top-[46%]" },
  { label: "Stack Exchange", className: "right-[14%] bottom-[11%]" },
];

const lines = ["rotate-0", "rotate-[30deg]", "-rotate-[30deg]"];

export function EvidenceMap() {
  return (
    <section id="sources" className="scroll-mt-24 py-20 sm:py-28">
      <Container className="grid items-center gap-10 lg:grid-cols-[4fr_5fr] lg:gap-16">
        {/* Copy */}
        <div>
          <p className="flex items-center gap-2 text-sm font-semibold text-[var(--color-primary)]">
            <Inbox className="h-4 w-4" aria-hidden />
            Where the evidence comes from
          </p>
          <h2 className="mt-5 text-balance text-3xl font-bold tracking-tight text-[var(--color-foreground)] sm:text-4xl">
            Seven named sources,{" "}
            <span className="text-[var(--color-primary)]">
              searched at once.
            </span>
          </h2>
          <p className="mt-4 text-base leading-relaxed text-[var(--color-muted-foreground)] sm:text-lg">
            When you type a market, Rift searches these seven places for real
            customer complaints. You can also paste your own reviews, support
            messages, or a spreadsheet. Everything lands in one project and
            feeds one set of scored ideas.
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            <EurekaLink href="/sign-up" className="rounded-full px-5">
              Try Rift free
            </EurekaLink>
            <Button asChild variant="secondary" className="rounded-full px-5">
              <Link href="/#faq">Read the FAQ</Link>
            </Button>
          </div>
        </div>

        {/* Node map (absolute layout on sm+; stacked core + chip list on phones,
            where the percentage-positioned pills would overlap the core) */}
        <div className="relative overflow-hidden rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] bg-grid-faint shadow-[var(--shadow-elevated)] sm:min-h-[440px]">
          {/* Center glow */}
          <div
            aria-hidden
            className="pointer-events-none absolute left-1/2 top-1/2 h-72 w-72 -translate-x-1/2 -translate-y-1/2 rounded-full blur-3xl"
            style={{ background: "rgba(59,130,246,0.12)" }}
          />
          {/* Connection lines */}
          {lines.map((rot) => (
            <div
              key={rot}
              aria-hidden
              className={`absolute left-1/2 top-1/2 hidden h-px w-[78%] -translate-x-1/2 sm:block ${rot}`}
              style={{
                background:
                  "linear-gradient(90deg, transparent, rgba(59,130,246,0.40), transparent)",
              }}
            />
          ))}
          {/* Core */}
          <div className="relative mx-auto mt-8 flex h-32 w-32 flex-col items-center justify-center gap-1.5 rounded-3xl border border-[var(--color-border)] bg-[#0a0a0a] shadow-[var(--shadow-elevated)] sm:absolute sm:left-1/2 sm:top-1/2 sm:mt-0 sm:-translate-x-1/2 sm:-translate-y-1/2">
            <RiftMark size={44} id="evidence-mark" />
            <span className="text-sm font-bold text-[var(--color-foreground)]">
              Rift
            </span>
          </div>
          {/* Source nodes (sm+) */}
          {nodes.map((node) => (
            <div
              key={node.label}
              className={`absolute hidden sm:block ${node.className} rounded-xl border border-[var(--color-border)] bg-[#0a0a0a] px-4 py-2.5 text-xs font-semibold text-[var(--color-foreground)] shadow-[var(--shadow-card)]`}
            >
              {node.label}
            </div>
          ))}
          {/* Mobile fallback: same sources as wrapping chips */}
          <div className="flex flex-wrap justify-center gap-2 p-6 sm:hidden">
            {nodes.map((node) => (
              <span
                key={node.label}
                className="rounded-xl border border-[var(--color-border)] bg-[#0a0a0a] px-4 py-2.5 text-xs font-semibold text-[var(--color-foreground)]"
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
