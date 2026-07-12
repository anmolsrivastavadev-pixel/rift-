import { Check, MessageCircleQuestion, Scale, X } from "lucide-react";

import { Container } from "@/components/container";
import { SectionHeader } from "@/components/landing/section-header";

/* "Why not just ChatGPT?" — the explicit comparison (post-M31). Honest
 * framing: different jobs, not "we're better". Every Rift claim on the right
 * maps to a shipped feature (receipts M31a, pain trend M31b, projects/scores/
 * reports M4–M29, weekly watch M31c). No fake stats, no overclaiming.
 */

const rows = [
  {
    chat: "Skims a few pages once, pastes a few links, forgets it all tomorrow",
    rift: "Collects hundreds of complaints from 7 sources into one evidence base. Deduped, stored, and every quote linked to its source",
  },
  {
    chat: "A different answer every time you ask",
    rift: "A fixed 0–100 scoring formula. The same complaints always give the same score, with the breakdown in the open",
  },
  {
    chat: "No dated history, so it can't tell if a problem is growing",
    rift: "Shows a pain trend from dated complaints, and says “Not enough data” instead of guessing",
  },
  {
    chat: "Only answers while you're typing",
    rift: "Watches your niche weekly and emails you when new complaints appear",
  },
];

export function ChatgptCompare() {
  return (
    <section id="why-rift" className="scroll-mt-24 py-20 sm:py-28">
      <Container>
        <SectionHeader
          icon={Scale}
          badge="Why Rift?"
          heading={
            <>
              A chat forgets.{" "}
              <span className="text-[var(--color-primary)]">
                Rift keeps receipts.
              </span>
            </>
          }
          lead="Even with web search, a chat skims a few pages and forgets them. Rift builds a stored evidence base: real complaints, linked to their source, tracked over time."
        />

        <div className="mt-12 grid gap-4 lg:grid-cols-2">
          {/* Chat AI card */}
          <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6 sm:p-8">
            <div className="flex items-center gap-2.5">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--color-muted-foreground)]/10">
                <MessageCircleQuestion
                  className="h-4.5 w-4.5 text-[var(--color-muted-foreground)]"
                  aria-hidden
                />
              </span>
              <h3 className="text-sm font-semibold text-[var(--color-muted-foreground)]">
                Asking a chat AI for business ideas
              </h3>
            </div>
            <ul className="mt-6 space-y-4">
              {rows.map((r) => (
                <li key={r.chat} className="flex gap-3">
                  <X
                    className="mt-0.5 h-4 w-4 shrink-0 text-[var(--color-muted-foreground)]/60"
                    aria-hidden
                  />
                  <span className="text-sm leading-relaxed text-[var(--color-muted-foreground)]">
                    {r.chat}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          {/* Rift card */}
          <div className="rounded-2xl border border-[var(--color-primary)]/30 bg-[var(--color-card)] p-6 shadow-[var(--shadow-card)] ring-1 ring-[var(--color-primary)]/20 sm:p-8">
            <div className="flex items-center gap-2.5">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--color-primary-soft)]">
                <Check
                  className="h-4.5 w-4.5 text-[var(--color-primary)]"
                  aria-hidden
                />
              </span>
              <h3 className="text-sm font-semibold text-[var(--color-foreground)]">
                Researching the same niche in Rift
              </h3>
            </div>
            <ul className="mt-6 space-y-4">
              {rows.map((r) => (
                <li key={r.rift} className="flex gap-3">
                  <Check
                    className="mt-0.5 h-4 w-4 shrink-0 text-[var(--color-primary)]"
                    aria-hidden
                  />
                  <span className="text-sm leading-relaxed text-[var(--color-foreground)]/90">
                    {r.rift}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <p className="mt-6 text-center text-sm text-[var(--color-muted-foreground)]">
          Use ChatGPT to brainstorm. Use Rift when you want proof a problem is
          real before you build.
        </p>
      </Container>
    </section>
  );
}
