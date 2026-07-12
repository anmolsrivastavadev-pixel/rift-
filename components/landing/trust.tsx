import { Calculator, Lock, ShieldCheck, Users } from "lucide-react";
import { Container } from "@/components/container";
import { SectionHeader } from "@/components/landing/section-header";

/* Trust and methodology (July 2026 landing redesign): plain answers to the
 * questions a careful visitor asks before signing up — how problems are
 * found, how the score works, what the AI does and doesn't do, and what
 * happens to pasted data. Sits right after the sources map so the two read
 * as one "can I trust this?" belt. No testimonials or user counts appear
 * anywhere on the page until real ones exist.
 */

const items = [
  {
    icon: Users,
    title: "Repeated problems, not one-off gripes",
    text: "An idea only appears when several different people describe the same problem. One angry post is noise; eleven people saying the same thing is a pattern.",
  },
  {
    icon: Calculator,
    title: "A score you can check",
    text: "Every idea gets a 0–100 score from a fixed formula: how often the problem appears, how severe it sounds, and how consistent the complaints are. The same complaints always give the same score.",
  },
  {
    icon: ShieldCheck,
    title: "AI that shows its working",
    text: "AI groups and summarises the complaints, and that's it. It never invents market sizes or statistics, and every conclusion links back to the complaints it came from.",
  },
  {
    icon: Lock,
    title: "Your data stays yours",
    text: "Feedback you paste is private to your account and only used to build your results. Nothing is public unless you create a share link, and you can delete your account, and everything in it, at any time.",
  },
];

export function Trust() {
  return (
    <section className="py-20 sm:py-28">
      <Container>
        <SectionHeader
          icon={ShieldCheck}
          badge="How results are made"
          heading={
            <>
              No black boxes,{" "}
              <span className="text-[var(--color-primary)]">
                no invented numbers.
              </span>
            </>
          }
          lead="Rift is a research tool, so you deserve to know exactly how it reaches its conclusions, and what happens to anything you paste in."
        />

        <div className="mt-12 grid gap-5 sm:grid-cols-2">
          {items.map((item) => (
            <div
              key={item.title}
              className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] p-6 sm:p-7"
            >
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--color-primary-soft)]">
                <item.icon
                  className="h-5 w-5 text-[var(--color-primary)]"
                  aria-hidden
                />
              </span>
              <h3 className="mt-4 text-base font-semibold text-[var(--color-foreground)]">
                {item.title}
              </h3>
              <p className="mt-2 text-base leading-relaxed text-[var(--color-muted-foreground)]">
                {item.text}
              </p>
            </div>
          ))}
        </div>
      </Container>
    </section>
  );
}
