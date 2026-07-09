import Link from "next/link";
import { ArrowRight, CheckCircle2, Circle } from "lucide-react";

import { Button } from "@/components/ui/button";
import { projectHref } from "@/lib/project-href";

/* M17 — Compact first-run onboarding card for the dashboard home.
 *
 * Progress is INFERRED from existing project data (no new model, nothing
 * stored): complaints exist → ideas exist → some testing progress exists
 * (a saved idea, a decision, or checklist progress). The card renders only
 * while a step is incomplete; once the user has real progress it disappears.
 * Server-rendered; all links preserve the current projectId via projectHref.
 */

export type OnboardingState = {
  complaintCount: number;
  opportunityCount: number;
  /** true when the user saved an idea, set a decision, or ticked a checklist item */
  hasTestingProgress: boolean;
};

type Step = {
  label: string;
  description: string;
  done: boolean;
  href: string;
  cta: string;
};

export function OnboardingCard({
  state,
  projectId,
}: {
  state: OnboardingState;
  projectId: string;
}) {
  const hasComplaints = state.complaintCount > 0;
  const hasIdeas = state.opportunityCount > 0;
  const done = hasComplaints && hasIdeas && state.hasTestingProgress;
  if (done) return null;

  const steps: Step[] = [
    {
      label: "Add complaints",
      description:
        "Paste reviews, upload a spreadsheet, or let the finder search seven sources for you.",
      done: hasComplaints,
      href: projectHref("/dashboard/complaints", projectId),
      cta: "Add complaints",
    },
    {
      label: "Find ideas",
      description:
        "Rift groups repeated problems and scores each idea 0–100.",
      done: hasIdeas,
      href: projectHref("/dashboard/opportunities", projectId),
      cta: "Find ideas",
    },
    {
      label: "Pick one to test",
      description: "Compare your top ideas side by side and mark one Pursue.",
      done: state.hasTestingProgress,
      href: projectHref("/dashboard/opportunities/decision-board", projectId),
      cta: "Compare ideas",
    },
  ];
  const active = steps.find((s) => !s.done) ?? steps[steps.length - 1];

  // First run (no complaints yet): the page below is essentially empty, so
  // the card acts as the page hero — full-size steps with descriptions and
  // one large CTA instead of a compact one-liner.
  if (!hasComplaints) {
    return (
      <section className="rounded-2xl border border-[var(--color-primary)]/30 bg-[var(--color-primary)]/5 p-6 sm:p-8">
        <h2 className="text-xl font-semibold tracking-tight">
          Start your market test
        </h2>
        <p className="mt-1 text-sm text-[var(--color-muted-foreground)]">
          Three steps from raw complaints to one idea worth testing.
        </p>
        <ol className="mt-6 space-y-4">
          {steps.map((step, i) => (
            <li key={step.label} className="flex gap-3.5">
              <span
                className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${
                  i === 0
                    ? "bg-[var(--color-primary-fill)] text-[var(--color-primary-foreground)]"
                    : "bg-[var(--color-primary-soft)] text-[var(--color-primary)] ring-1 ring-[var(--color-primary)]/20"
                }`}
              >
                {i + 1}
              </span>
              <div className="min-w-0">
                <p className="text-sm font-medium text-[var(--color-foreground)]">
                  {step.label}
                </p>
                <p className="mt-0.5 text-xs leading-relaxed text-[var(--color-muted-foreground)]">
                  {step.description}
                </p>
              </div>
            </li>
          ))}
        </ol>
        <Button asChild size="lg" className="mt-7">
          <Link href={steps[0].href}>
            Add complaints <ArrowRight className="h-4 w-4" />
          </Link>
        </Button>
      </section>
    );
  }

  return (
    <section className="rounded-2xl border border-[var(--color-primary)]/30 bg-[var(--color-primary)]/5 p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <h2 className="text-lg font-semibold tracking-tight">Start your market test</h2>
          <ol className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1">
            {steps.map((step, i) => (
              <li key={step.label} className="flex items-center gap-1.5 text-xs">
                {step.done ? (
                  <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-[var(--color-success)]" />
                ) : (
                  <Circle
                    className={`h-3.5 w-3.5 shrink-0 ${
                      step === active
                        ? "text-[var(--color-primary)]"
                        : "text-[var(--color-muted-foreground)]/50"
                    }`}
                  />
                )}
                <span
                  className={
                    step.done
                      ? "text-[var(--color-muted-foreground)] line-through"
                      : step === active
                        ? "font-medium text-[var(--color-foreground)]"
                        : "text-[var(--color-muted-foreground)]"
                  }
                >
                  {i + 1}. {step.label}
                </span>
              </li>
            ))}
          </ol>
        </div>
        <Button asChild>
          <Link href={active.href}>
            {active.cta} <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </Button>
      </div>
    </section>
  );
}
