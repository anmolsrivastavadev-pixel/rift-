"use client";

import { ArrowRight, Info } from "lucide-react";
import Link from "next/link";

import {
  computeNextAction,
  type DashboardStats,
} from "@/lib/dashboard-plan";
import { Button } from "@/components/ui/button";
import { projectHref } from "@/lib/project-href";

export type DecisionCounts = {
  pursue: number;
  park: number;
  reject: number;
  undecided: number;
};

/* Read-only client component for the Founder Command Center.
 * M16C: decision counts come from the database via the server page (no more
 * localStorage reads), so the summary is identical on every device.
 * Passes the summary + server stats into the pure helpers to compute the
 * recommended next action.
 */
export function FounderCommandClient({
  stats,
  decisionCounts,
  projectId,
}: {
  stats: DashboardStats;
  decisionCounts: DecisionCounts;
  projectId: string;
}) {
  const decided =
    decisionCounts.pursue + decisionCounts.park + decisionCounts.reject;
  const nextAction = computeNextAction(stats, {
    hasNonUndecidedDecision: decided > 0,
    hasPursue: decisionCounts.pursue > 0,
  });

  return (
    <div className="space-y-8">
      <section className="rounded-xl border border-[var(--color-primary)]/30 bg-[var(--color-primary)]/5 p-6 shadow-[0_1px_3px_0_rgb(0_0_0_/_0.04),0_1px_2px_-1px_rgb(0_0_0_/_0.06)]">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-[11px] uppercase tracking-wide text-[var(--color-primary)]">
              Next step
            </p>
            <h2 className="mt-1 text-lg font-semibold tracking-tight">{nextAction.title}</h2>
            <p className="mt-1 text-xs text-[var(--color-muted-foreground)]">
              {nextAction.description}
            </p>
          </div>
          <Button asChild>
            <Link href={projectHref(nextAction.href, projectId)}>
              {nextAction.cta} <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </Button>
        </div>
      </section>

      {stats.opportunityCount > 0 && (
        <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] p-5 shadow-[0_1px_3px_0_rgb(0_0_0_/_0.04),0_1px_2px_-1px_rgb(0_0_0_/_0.06)]">
          <h3 className="text-sm font-semibold">Decision status</h3>
          <div className="mt-3 grid grid-cols-4 gap-2 text-center">
            <SnapshotCount label="Pursue" value={decisionCounts.pursue} accent="success" />
            <SnapshotCount label="Park" value={decisionCounts.park} accent="warning" />
            <SnapshotCount label="Reject" value={decisionCounts.reject} accent="danger" />
            <SnapshotCount label="Undecided" value={decisionCounts.undecided} accent="muted" />
          </div>
          <Link
            href={projectHref("/dashboard/opportunities/decision-board", projectId)}
            className="mt-3 inline-block text-xs text-[var(--color-primary)] hover:underline"
          >
            Open Compare Ideas →
          </Link>
        </div>
      )}

      <p className="flex items-center gap-1 text-[11px] text-[var(--color-muted-foreground)]">
        <Info className="h-3 w-3" /> Decisions are saved to your account.
      </p>
    </div>
  );
}

function SnapshotCount({
  label,
  value,
  accent,
}: {
  label: string;
  value: React.ReactNode;
  accent?: "success" | "warning" | "danger" | "muted";
}) {
  const colorClass =
    accent === "success"
      ? "text-[var(--color-success)]"
      : accent === "warning"
        ? "text-[var(--color-warning)]"
        : accent === "danger"
          ? "text-[var(--color-danger)]"
          : accent === "muted"
            ? "text-[var(--color-muted-foreground)]"
            : "text-[var(--color-foreground)]";
  return (
    <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-card)] p-2">
      <p className={`text-lg font-bold ${colorClass}`}>{value}</p>
      <p className="text-[10px] text-[var(--color-muted-foreground)]">{label}</p>
    </div>
  );
}
