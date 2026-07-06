import Link from "next/link";
import { Inbox } from "lucide-react";
import { Container } from "@/components/container";
import { Button } from "@/components/ui/button";
import { RiftMark } from "@/components/logo";

/* "Bring your own evidence" section: complaint sources orbiting the Rift
 * mark, connected by faint lines. Built from positioned divs, no images.
 */

const nodes = [
  { label: "App reviews", className: "left-[8%] top-[12%]" },
  { label: "Support tickets", className: "left-[4%] top-[45%]" },
  { label: "Customer calls", className: "left-[16%] bottom-[10%]" },
  { label: "Reddit posts", className: "right-[8%] top-[14%]" },
  { label: "Hacker News", className: "right-[4%] top-[46%]" },
  { label: "Surveys", className: "right-[14%] bottom-[11%]" },
];

const lines = ["rotate-0", "rotate-[30deg]", "-rotate-[30deg]"];

export function EvidenceMap() {
  return (
    <section className="py-20 sm:py-28">
      <Container className="grid items-center gap-10 lg:grid-cols-[4fr_5fr] lg:gap-16">
        {/* Copy */}
        <div>
          <span className="inline-flex items-center gap-2 rounded-full border border-[var(--color-primary)]/30 bg-[var(--color-primary-soft)] px-4 py-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--color-primary)]">
            <Inbox className="h-3.5 w-3.5" aria-hidden />
            Bring your own evidence
          </span>
          <h2 className="mt-6 text-balance text-3xl font-bold tracking-tight text-[var(--color-foreground)] sm:text-4xl">
            Every scattered complaint,{" "}
            <span className="text-[var(--color-primary)]">
              one research graph.
            </span>
          </h2>
          <p className="mt-4 leading-relaxed text-[var(--color-muted-foreground)]">
            Paste it, upload a CSV, or let the built-in finder search Reddit,
            Hacker News, and app reviews for you. Every source lands in one
            project and feeds one set of scored ideas.
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            <Button asChild className="rounded-full px-5">
              <Link href="/dashboard">Run your complaints</Link>
            </Button>
            <Button asChild variant="secondary" className="rounded-full px-5">
              <Link href="/#faq">Read the FAQ</Link>
            </Button>
          </div>
        </div>

        {/* Node map */}
        <div className="relative min-h-[380px] overflow-hidden rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] bg-grid-faint shadow-[var(--shadow-elevated)] sm:min-h-[440px]">
          {/* Center glow */}
          <div
            aria-hidden
            className="pointer-events-none absolute left-1/2 top-1/2 h-72 w-72 -translate-x-1/2 -translate-y-1/2 rounded-full blur-3xl"
            style={{ background: "rgba(59,130,246,0.14)" }}
          />
          {/* Connection lines */}
          {lines.map((rot) => (
            <div
              key={rot}
              aria-hidden
              className={`absolute left-1/2 top-1/2 h-px w-[78%] -translate-x-1/2 ${rot}`}
              style={{
                background:
                  "linear-gradient(90deg, transparent, rgba(96,165,250,0.45), transparent)",
              }}
            />
          ))}
          {/* Core */}
          <div className="absolute left-1/2 top-1/2 flex h-32 w-32 -translate-x-1/2 -translate-y-1/2 flex-col items-center justify-center gap-1.5 rounded-3xl border border-[var(--color-border)] bg-[#0d1117] shadow-[var(--shadow-elevated)]">
            <RiftMark size={44} id="evidence-mark" />
            <span className="text-sm font-bold text-[var(--color-foreground)]">
              Rift
            </span>
          </div>
          {/* Source nodes */}
          {nodes.map((node) => (
            <div
              key={node.label}
              className={`absolute ${node.className} rounded-xl border border-[var(--color-border)] bg-[#0d1117] px-4 py-2.5 text-xs font-semibold text-[var(--color-foreground)] shadow-[var(--shadow-card)]`}
            >
              {node.label}
            </div>
          ))}
        </div>
      </Container>
    </section>
  );
}
